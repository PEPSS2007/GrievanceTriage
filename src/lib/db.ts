import { createClient, SupabaseClient } from "@supabase/supabase-js";
import taxonomyData from "../data/taxonomy.json";
import seedComplaintsData from "../data/seed_complaints.json";
import {
  Department,
  Complaint,
  Analysis,
  ReviewDecision,
  IncidentGroup,
  IncidentMember,
  Handoff,
  Escalation,
  AuditLogEntry,
} from "../contracts";

export interface DatabaseAdapter {
  getDepartments(): Promise<Department[]>;
  getDepartmentById(id: string): Promise<Department | null>;
  getComplaints(): Promise<Complaint[]>;
  getComplaintById(id: string): Promise<Complaint | null>;
  createComplaint(complaint: Complaint): Promise<Complaint>;
  getAnalyses(): Promise<Analysis[]>;
  getAnalysisByComplaintId(id: string): Promise<Analysis | null>;
  saveAnalysis(analysis: Analysis): Promise<Analysis>;
  getDecisions(): Promise<ReviewDecision[]>;
  getDecisionByComplaintId(id: string): Promise<ReviewDecision | null>;
  saveDecision(decision: ReviewDecision): Promise<ReviewDecision>;
  getIncidentGroups(): Promise<IncidentGroup[]>;
  getIncidentMembers(groupId?: string): Promise<IncidentMember[]>;
  saveIncidentGroup(group: IncidentGroup): Promise<IncidentGroup>;
  saveIncidentMember(member: IncidentMember): Promise<IncidentMember>;
  updateIncidentMemberStatus(groupId: string, complaintId: string, status: "suggested" | "confirmed" | "rejected"): Promise<void>;
  getHandoffs(complaintId?: string): Promise<Handoff[]>;
  saveHandoff(handoff: Handoff): Promise<Handoff>;
  updateHandoffStatus(id: string, status: "Prepared" | "Initiated" | "Acknowledged"): Promise<void>;
  saveEscalation(escalation: Escalation): Promise<Escalation>;
  getEscalations(complaintId?: string): Promise<Escalation[]>;
  logAudit(entry: Omit<AuditLogEntry, "created_at">): Promise<void>;
  getAuditLogs(limitOrComplaintId?: number | string, maybeComplaintId?: string): Promise<AuditLogEntry[]>;
  resetToDemo(): Promise<void>;
}

// In-Memory store initialized with seed data for offline / fallback mode
class InMemoryStore implements DatabaseAdapter {
  private departments: Map<string, Department> = new Map();
  private complaints: Map<string, Complaint> = new Map();
  private analyses: Map<string, Analysis> = new Map();
  private decisions: Map<string, ReviewDecision> = new Map();
  private incidentGroups: Map<string, IncidentGroup> = new Map();
  private incidentMembers: IncidentMember[] = [];
  private handoffs: Map<string, Handoff> = new Map();
  private escalations: Escalation[] = [];
  private auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.resetSync();
  }

  private resetSync() {
    // Preserve any genuine/manual non-demo complaints across demo resets
    const preservedComplaints = Array.from(this.complaints.values()).filter(c => (c as any).is_demo === false);
    const preservedAnalyses = preservedComplaints.map(c => this.analyses.get(c.id)).filter(Boolean) as Analysis[];
    const preservedDecisions = preservedComplaints.map(c => this.decisions.get(c.id)).filter(Boolean) as ReviewDecision[];
    const preservedAudit = this.auditLogs.filter(a => a.entity_id !== "DEMO_RESET");

    this.departments.clear();
    this.complaints.clear();
    this.analyses.clear();
    this.decisions.clear();
    this.incidentGroups.clear();
    this.incidentMembers = [];
    this.handoffs.clear();
    this.escalations = [];
    this.auditLogs = [];

    // Load departments from taxonomy
    for (const dept of taxonomyData.departments) {
      this.departments.set(dept.id, {
        id: dept.id,
        name: dept.name,
        categories: dept.categories,
        email: dept.email,
        phone: dept.phone,
        website: dept.website,
        portal: dept.portal,
        escalation_contact: dept.escalation_contact,
        is_demo: dept.is_demo ?? true,
      });
    }

    // Load complaints and precomputed analyses (marked as synthetic demo)
    for (const record of seedComplaintsData) {
      this.complaints.set(record.id, {
        id: record.id,
        text: record.text,
        location: record.location,
        source: record.source,
        created_at: record.created_at,
        is_demo: true,
      } as Complaint);

      if (record.precomputed_analysis) {
        this.analyses.set(record.id, record.precomputed_analysis as Analysis);
      }

      // Populate default decisions for initial seed state
      this.decisions.set(record.id, {
        complaint_id: record.id,
        approved_category: record.ground_truth_category,
        approved_priority: record.ground_truth_priority as any,
        approved_department_id: record.ground_truth_department,
        status: record.is_vague ? "Needs More Information" : "Pending Review",
        decided_at: record.created_at,
      });

      // Populate incident groups if assigned
      if (record.incident_group_id) {
        if (!this.incidentGroups.has(record.incident_group_id)) {
          this.incidentGroups.set(record.incident_group_id, {
            id: record.incident_group_id,
            title: `Incident: ${record.ground_truth_category} at ${record.location}`,
            category: record.ground_truth_category,
            created_at: record.created_at,
          });
        }
        this.incidentMembers.push({
          group_id: record.incident_group_id,
          complaint_id: record.id,
          similarity_score: 0.88,
          reasons: ["High lexical overlap", "Same municipal ward and sector"],
          membership_status: "suggested",
        });
      }
    }

    // Restore preserved manual complaints
    for (const c of preservedComplaints) {
      this.complaints.set(c.id, c);
    }
    for (const a of preservedAnalyses) {
      this.analyses.set(a.complaint_id, a);
    }
    for (const d of preservedDecisions) {
      this.decisions.set(d.complaint_id, d);
    }
    this.auditLogs.push(...preservedAudit);

    this.auditLogs.push({
      id: 1,
      entity_name: "SYSTEM",
      entity_id: "DEMO_RESET",
      action: "RESET_DATABASE",
      before_state: null,
      after_state: { complaint_count: this.complaints.size },
      reviewer: "System Initializer",
      created_at: new Date().toISOString(),
    });
  }

  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    return this.departments.get(id) || null;
  }

  async getComplaints(): Promise<Complaint[]> {
    return Array.from(this.complaints.values());
  }

  async getComplaintById(id: string): Promise<Complaint | null> {
    return this.complaints.get(id) || null;
  }

  async createComplaint(complaint: Complaint): Promise<Complaint> {
    const record: Complaint = {
      ...complaint,
      is_demo: complaint.is_demo ?? false,
    };
    this.complaints.set(complaint.id, record);
    return record;
  }

  async getAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values());
  }

  async getAnalysisByComplaintId(id: string): Promise<Analysis | null> {
    return this.analyses.get(id) || null;
  }

  async saveAnalysis(analysis: Analysis): Promise<Analysis> {
    this.analyses.set(analysis.complaint_id, analysis);
    return analysis;
  }

  async getDecisions(): Promise<ReviewDecision[]> {
    return Array.from(this.decisions.values());
  }

  async getDecisionByComplaintId(id: string): Promise<ReviewDecision | null> {
    return this.decisions.get(id) || null;
  }

  async saveDecision(decision: ReviewDecision): Promise<ReviewDecision> {
    this.decisions.set(decision.complaint_id, decision);
    return decision;
  }

  async getIncidentGroups(): Promise<IncidentGroup[]> {
    return Array.from(this.incidentGroups.values());
  }

  async getIncidentMembers(groupId?: string): Promise<IncidentMember[]> {
    if (groupId) {
      return this.incidentMembers.filter((m) => m.group_id === groupId);
    }
    return this.incidentMembers;
  }

  async saveIncidentGroup(group: IncidentGroup): Promise<IncidentGroup> {
    this.incidentGroups.set(group.id, group);
    return group;
  }

  async saveIncidentMember(member: IncidentMember): Promise<IncidentMember> {
    const existingIndex = this.incidentMembers.findIndex(
      (m) => m.group_id === member.group_id && m.complaint_id === member.complaint_id
    );
    if (existingIndex >= 0) {
      this.incidentMembers[existingIndex] = member;
    } else {
      this.incidentMembers.push(member);
    }
    return member;
  }

  async updateIncidentMemberStatus(
    groupId: string,
    complaintId: string,
    status: "suggested" | "confirmed" | "rejected"
  ): Promise<void> {
    const member = this.incidentMembers.find(
      (m) => m.group_id === groupId && m.complaint_id === complaintId
    );
    if (member) {
      member.membership_status = status;
    }
  }

  async getHandoffs(complaintId?: string): Promise<Handoff[]> {
    const list = Array.from(this.handoffs.values());
    if (complaintId) {
      return list.filter((h) => h.complaint_id === complaintId);
    }
    return list;
  }

  async saveHandoff(handoff: Handoff): Promise<Handoff> {
    this.handoffs.set(handoff.id, handoff);
    return handoff;
  }

  async updateHandoffStatus(
    id: string,
    status: "Prepared" | "Initiated" | "Acknowledged"
  ): Promise<void> {
    const h = this.handoffs.get(id);
    if (h) {
      h.status = status;
    }
  }

  async saveEscalation(escalation: Escalation): Promise<Escalation> {
    this.escalations.push(escalation);
    return escalation;
  }

  async getEscalations(complaintId?: string): Promise<Escalation[]> {
    if (complaintId) {
      return this.escalations.filter((e) => e.complaint_id === complaintId);
    }
    return this.escalations;
  }

  async logAudit(entry: Omit<AuditLogEntry, "created_at">): Promise<void> {
    this.auditLogs.unshift({
      ...entry,
      id: this.auditLogs.length + 1,
      created_at: new Date().toISOString(),
    });
  }

  async getAuditLogs(limitOrComplaintId?: number | string, maybeComplaintId?: string): Promise<AuditLogEntry[]> {
    const limit = typeof limitOrComplaintId === "number" ? limitOrComplaintId : 50;
    const complaintId = typeof limitOrComplaintId === "string" ? limitOrComplaintId : maybeComplaintId;

    if (complaintId) {
      return this.auditLogs
        .filter(
          (a) =>
            a.entity_id === complaintId ||
            (a.after_state as any)?.complaint_id === complaintId ||
            (a.before_state as any)?.complaint_id === complaintId
        )
        .slice(0, limit);
    }
    return this.auditLogs.slice(0, limit);
  }

  async resetToDemo(): Promise<void> {
    this.resetSync();
  }
}

// Supabase Remote Postgres Store
class SupabaseStore implements DatabaseAdapter {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  async getDepartments(): Promise<Department[]> {
    const { data, error } = await this.client.from("departments").select("*");
    if (error) throw error;
    return data as Department[];
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    const { data, error } = await this.client.from("departments").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Department | null;
  }

  async getComplaints(): Promise<Complaint[]> {
    const { data, error } = await this.client.from("complaints").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as Complaint[];
  }

  async getComplaintById(id: string): Promise<Complaint | null> {
    const { data, error } = await this.client.from("complaints").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Complaint | null;
  }

  async createComplaint(complaint: Complaint): Promise<Complaint> {
    const { data, error } = await this.client.from("complaints").upsert(complaint).select().single();
    if (error) throw error;
    return data as Complaint;
  }

  async getAnalyses(): Promise<Analysis[]> {
    const { data, error } = await this.client.from("analyses").select("*");
    if (error) throw error;
    return data as Analysis[];
  }

  async getAnalysisByComplaintId(id: string): Promise<Analysis | null> {
    const { data, error } = await this.client.from("analyses").select("*").eq("complaint_id", id).maybeSingle();
    if (error) throw error;
    return data as Analysis | null;
  }

  async saveAnalysis(analysis: Analysis): Promise<Analysis> {
    const { data, error } = await this.client.from("analyses").upsert(analysis).select().single();
    if (error) throw error;
    return data as Analysis;
  }

  async getDecisions(): Promise<ReviewDecision[]> {
    const { data, error } = await this.client.from("decisions").select("*");
    if (error) throw error;
    return data as ReviewDecision[];
  }

  async getDecisionByComplaintId(id: string): Promise<ReviewDecision | null> {
    const { data, error } = await this.client.from("decisions").select("*").eq("complaint_id", id).maybeSingle();
    if (error) throw error;
    return data as ReviewDecision | null;
  }

  async saveDecision(decision: ReviewDecision): Promise<ReviewDecision> {
    const { data, error } = await this.client.from("decisions").upsert(decision).select().single();
    if (error) throw error;
    return data as ReviewDecision;
  }

  async getIncidentGroups(): Promise<IncidentGroup[]> {
    const { data, error } = await this.client.from("incident_groups").select("*");
    if (error) throw error;
    return data as IncidentGroup[];
  }

  async getIncidentMembers(groupId?: string): Promise<IncidentMember[]> {
    let query = this.client.from("incident_members").select("*");
    if (groupId) query = query.eq("group_id", groupId);
    const { data, error } = await query;
    if (error) throw error;
    return data as IncidentMember[];
  }

  async saveIncidentGroup(group: IncidentGroup): Promise<IncidentGroup> {
    const { data, error } = await this.client.from("incident_groups").upsert(group).select().single();
    if (error) throw error;
    return data as IncidentGroup;
  }

  async saveIncidentMember(member: IncidentMember): Promise<IncidentMember> {
    const { data, error } = await this.client.from("incident_members").upsert(member).select().single();
    if (error) throw error;
    return data as IncidentMember;
  }

  async updateIncidentMemberStatus(groupId: string, complaintId: string, status: "suggested" | "confirmed" | "rejected"): Promise<void> {
    const { error } = await this.client.from("incident_members").update({ membership_status: status }).match({ group_id: groupId, complaint_id: complaintId });
    if (error) throw error;
  }

  async getHandoffs(complaintId?: string): Promise<Handoff[]> {
    let query = this.client.from("handoffs").select("*");
    if (complaintId) query = query.eq("complaint_id", complaintId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Handoff[];
  }

  async saveHandoff(handoff: Handoff): Promise<Handoff> {
    const { data, error } = await this.client.from("handoffs").upsert(handoff).select().single();
    if (error) throw error;
    return data as Handoff;
  }

  async updateHandoffStatus(id: string, status: "Prepared" | "Initiated" | "Acknowledged"): Promise<void> {
    const { error } = await this.client.from("handoffs").update({ status }).eq("id", id);
    if (error) throw error;
  }

  async saveEscalation(escalation: Escalation): Promise<Escalation> {
    const { data, error } = await this.client.from("escalations").insert(escalation).select().single();
    if (error) throw error;
    return data as Escalation;
  }

  async getEscalations(complaintId?: string): Promise<Escalation[]> {
    let query = this.client.from("escalations").select("*");
    if (complaintId) query = query.eq("complaint_id", complaintId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Escalation[];
  }

  async logAudit(entry: Omit<AuditLogEntry, "created_at">): Promise<void> {
    const { error } = await this.client.from("audit_log").insert(entry);
    if (error) console.error("Failed to write audit log:", error);
  }

  async getAuditLogs(limitOrComplaintId?: number | string, maybeComplaintId?: string): Promise<AuditLogEntry[]> {
    const limit = typeof limitOrComplaintId === "number" ? limitOrComplaintId : 50;
    const complaintId = typeof limitOrComplaintId === "string" ? limitOrComplaintId : maybeComplaintId;

    let query = this.client
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (complaintId) {
      query = query.eq("entity_id", complaintId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as AuditLogEntry[];
  }

  async resetToDemo(): Promise<void> {
    // Delete existing records
    await this.client.from("audit_log").delete().neq("id", 0);
    await this.client.from("escalations").delete().neq("id", 0);
    await this.client.from("handoffs").delete().neq("id", "");
    await this.client.from("incident_members").delete().neq("group_id", "");
    await this.client.from("incident_groups").delete().neq("id", "");
    await this.client.from("decisions").delete().neq("complaint_id", "");
    await this.client.from("analyses").delete().neq("complaint_id", "");
    await this.client.from("complaints").delete().neq("id", "");
    await this.client.from("departments").delete().neq("id", "");

    // Seed departments
    await this.client.from("departments").insert(taxonomyData.departments);

    // Seed complaints
    const complaints = seedComplaintsData.map((c) => ({
      id: c.id,
      text: c.text,
      location: c.location,
      source: c.source,
      created_at: c.created_at,
    }));
    await this.client.from("complaints").insert(complaints);

    // Seed analyses
    const analyses = seedComplaintsData
      .filter((c) => c.precomputed_analysis)
      .map((c) => c.precomputed_analysis);
    await this.client.from("analyses").insert(analyses);

    // Seed decisions
    const decisions = seedComplaintsData.map((c) => ({
      complaint_id: c.id,
      approved_category: c.ground_truth_category,
      approved_priority: c.ground_truth_priority,
      approved_department_id: c.ground_truth_department,
      status: c.is_vague ? "Needs More Information" : "Pending Review",
      decided_at: c.created_at,
    }));
    await this.client.from("decisions").insert(decisions);
  }
}

// Singleton database instance selector attached to globalThis for Next.js dev persistence
const globalForDb = globalThis as unknown as { dbInstance?: DatabaseAdapter };

export function getDatabase(): DatabaseAdapter {
  if (globalForDb.dbInstance) return globalForDb.dbInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes("your-project-id")) {
    globalForDb.dbInstance = new SupabaseStore(supabaseUrl, serviceRoleKey);
  } else {
    globalForDb.dbInstance = new InMemoryStore();
  }

  return globalForDb.dbInstance;
}
