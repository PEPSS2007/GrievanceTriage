'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  Complaint,
  Analysis,
  Decision,
  IncidentGroup,
  IncidentMember,
  Handoff,
  AuditLogEntry,
  MergedComplaintView,
  PriorityType,
  StatusType,
  RelationshipStatus,
  Department,
  EscalationItem,
  AccessibilitySettings,
  AppLanguage,
  SpeechSpeed,
  TabType,
  ComplaintAttachment,
  MethodType,
  IntakeChannel,
  ResolutionEvidence
} from '../types';
import {
  DEPARTMENTS,
  SEED_COMPLAINTS,
  SEED_ANALYSES,
  SEED_DECISIONS,
  SEED_INCIDENT_GROUPS,
  SEED_INCIDENT_MEMBERS,
  SEED_HANDOFFS,
  SEED_AUDIT_LOGS,
  SEED_ESCALATIONS
} from '../data/mockData';
import { t as translate, TranslationDictionary } from '../lib/i18n';

export type { TabType, AccessibilitySettings, AppLanguage, SpeechSpeed };

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  language: 'en',
  voiceInput: false,
  voiceOutput: false,
  autoRead: false,
  speechSpeed: 'normal',
  hasConfiguredPreferences: false
};

interface TriageContextType {
  departments: Department[];
  complaints: Complaint[];
  analyses: Record<string, Analysis>;
  decisions: Record<string, Decision>;
  incidentGroups: IncidentGroup[];
  incidentMembers: IncidentMember[];
  handoffs: Handoff[];
  auditLogs: AuditLogEntry[];
  escalations: EscalationItem[];
  selectedComplaintId: string | null;
  activeTab: TabType;
  showDetail: boolean;
  searchQuery: string;
  categoryFilter: string;
  priorityFilter: string;
  statusFilter: string;
  channelFilter: string;
  demoFilter: 'ALL' | 'DEMO' | 'OFFICIAL';
  needsReviewOnly: boolean;
  isHydrated: boolean;
  settings: AccessibilitySettings;

  // Setters
  setSelectedComplaintId: (id: string | null) => void;
  setActiveTab: (tab: TabType) => void;
  setShowDetail: (show: boolean) => void;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (cat: string) => void;
  setPriorityFilter: (p: string) => void;
  setStatusFilter: (s: string) => void;
  setChannelFilter: (ch: string) => void;
  setDemoFilter: (d: 'ALL' | 'DEMO' | 'OFFICIAL') => void;
  setNeedsReviewOnly: (val: boolean) => void;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;

  // Actions
  openComplaintDetail: (id: string) => void;
  approveComplaint: (id: string, note?: string) => void;
  editAndOverrideComplaint: (
    id: string,
    updates: {
      category: string;
      priority: PriorityType;
      departmentId: string;
      action: string;
      note: string;
    }
  ) => void;
  rejectComplaint: (id: string, reason: string) => void;
  requestMoreInfo: (id: string, note: string) => void;
  updateStatus: (id: string, newStatus: StatusType, note?: string) => void;
  confirmIncidentMember: (groupId: string, complaintId: string) => void;
  rejectIncidentMember: (groupId: string, complaintId: string) => void;
  createHandoff: (h: Omit<Handoff, 'id' | 'created_at'>) => void;
  escalateComplaint: (
    id: string,
    level: 'Level 1' | 'Level 2' | 'Level 3',
    reason: string,
    followUpAt: string
  ) => void;
  submitComplaint: (data: {
    title?: string;
    text: string;
    location: string;
    category?: string;
    source?: Complaint['source'];
  }) => Promise<Complaint>;
  registerOfficerComplaint: (data: {
    text: string;
    location: string;
    ward?: string;
    lat?: number;
    lng?: number;
    source: IntakeChannel;
    category?: string;
    date_received?: string;
    reporting_person?: { name?: string; contact?: string };
    source_reference?: string;
    receiving_officer?: string;
    officer_notes?: string;
    attachments?: ComplaintAttachment[];
  }) => Promise<Complaint>;
  importCsvComplaints: (
    rows: Array<{
      text: string;
      location: string;
      ward?: string;
      category?: string;
      priority?: PriorityType;
      source_reference?: string;
    }>,
    importingOfficer?: string
  ) => Promise<{
    successCount: number;
    duplicateCount: number;
    failedCount: number;
    message: string;
  }>;
  resetDemoData: () => void;
  t: (key: keyof TranslationDictionary) => string;

  // Real-time Action Extensions
  updateComplaintLocation: (id: string, lat: number, lng: number, locationName?: string) => void;
  addAttachmentToComplaint: (id: string, attachment: ComplaintAttachment) => void;
  reanalyzeWithVision: (
    id: string,
    visionResult: {
      observations: string[];
      inferred_relevance: string;
      method: MethodType;
      confidence: number;
      updated_summary: string;
    }
  ) => void;
  submitResolutionEvidence: (
    id: string,
    evidence: {
      note: string;
      officer_name: string;
      department_id?: string;
      action_taken?: string;
      work_order_ref?: string;
      photo_url?: string;
      photo_name?: string;
    }
  ) => void;
  verifyResolution: (
    id: string,
    reviewer: string,
    note?: string,
    allowException?: boolean,
    exceptionReason?: string
  ) => void;
  rejectResolution: (id: string, reason: string, reviewer?: string) => void;
  reopenComplaint: (id: string, reason: string, reviewer?: string) => void;
  disputeOrReopenResolution: (id: string, reason: string) => void;
  replyInformationRequest: (
    id: string,
    replyText: string,
    photoAttachment?: ComplaintAttachment
  ) => void;
  getAuditLogsForComplaint: (complaintId: string) => AuditLogEntry[];

  // View Models
  getMergedComplaint: (idOrShortId: string) => MergedComplaintView | undefined;
  mergedComplaints: MergedComplaintView[];
  filteredComplaints: MergedComplaintView[];
}

const TriageContext = createContext<TriageContextType | undefined>(undefined);

const STORAGE_KEYS = {
  DECISIONS: 'grievancetriage_decisions_v1',
  MEMBERS: 'grievancetriage_members_v1',
  HANDOFFS: 'grievancetriage_handoffs_v1',
  AUDIT: 'grievancetriage_audit_v1',
  ESCALATIONS: 'grievancetriage_escalations_v1',
  SETTINGS: 'grievancetriage_accessibility_settings_v1',
  RESOLUTIONS: 'grievancetriage_resolutions_v1',
  MANUAL_COMPLAINTS: 'grievancetriage_manual_complaints_v1'
};

export function TriageProvider({ children }: { children: React.ReactNode }) {
  const [departments] = useState<Department[]>(DEPARTMENTS);
  const [complaints, setComplaints] = useState<Complaint[]>(SEED_COMPLAINTS);
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>(SEED_ANALYSES);
  const [incidentGroups] = useState<IncidentGroup[]>(SEED_INCIDENT_GROUPS);

  const [decisions, setDecisions] = useState<Record<string, Decision>>(SEED_DECISIONS);
  const [incidentMembers, setIncidentMembers] = useState<IncidentMember[]>(SEED_INCIDENT_MEMBERS);
  const [handoffs, setHandoffs] = useState<Handoff[]>(SEED_HANDOFFS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(SEED_AUDIT_LOGS);
  const [escalations, setEscalations] = useState<EscalationItem[]>(SEED_ESCALATIONS);
  const [resolutionEvidences, setResolutionEvidences] = useState<Record<string, ResolutionEvidence>>({});
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);

  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>('GRV-2026-1001');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [demoFilter, setDemoFilter] = useState<'ALL' | 'DEMO' | 'OFFICIAL'>('ALL');
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate state from localStorage on browser mount (Task 7 & Settings Persistence)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedDecisions = localStorage.getItem(STORAGE_KEYS.DECISIONS);
        if (storedDecisions) setDecisions(JSON.parse(storedDecisions));

        const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
        if (storedMembers) setIncidentMembers(JSON.parse(storedMembers));

        const storedHandoffs = localStorage.getItem(STORAGE_KEYS.HANDOFFS);
        if (storedHandoffs) setHandoffs(JSON.parse(storedHandoffs));

        const storedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
        if (storedAudit) setAuditLogs(JSON.parse(storedAudit));

        const storedEscalations = localStorage.getItem(STORAGE_KEYS.ESCALATIONS);
        if (storedEscalations) setEscalations(JSON.parse(storedEscalations));

        const storedResolutions = localStorage.getItem(STORAGE_KEYS.RESOLUTIONS);
        if (storedResolutions) setResolutionEvidences(JSON.parse(storedResolutions));

        const storedManual = localStorage.getItem(STORAGE_KEYS.MANUAL_COMPLAINTS);
        if (storedManual) {
          try {
            const parsedManual: Complaint[] = JSON.parse(storedManual);
            setComplaints(prev => {
              const existingIds = new Set(prev.map(c => c.id));
              const newToAdd = parsedManual.filter(c => !existingIds.has(c.id));
              return [...newToAdd, ...prev];
            });
          } catch (e) {}
        }

        const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (storedSettings) {
          try {
            setSettings(JSON.parse(storedSettings));
          } catch (e) {
            console.warn('Settings parse notice:', e);
          }
        }
      }
    } catch (e) {
      console.warn('localStorage hydration warning:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates, hasConfiguredPreferences: true };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to persist settings:', e);
        }
      }
      return next;
    });
  };

  const t = (key: keyof TranslationDictionary): string => {
    return translate(key, settings.language);
  };

  // Save changes to localStorage whenever persisted state mutates
  const persistState = (
    newDecisions?: Record<string, Decision>,
    newMembers?: IncidentMember[],
    newHandoffs?: Handoff[],
    newAudit?: AuditLogEntry[],
    newEscalations?: EscalationItem[]
  ) => {
    if (typeof window === 'undefined') return;
    try {
      if (newDecisions) localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(newDecisions));
      if (newMembers) localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(newMembers));
      if (newHandoffs) localStorage.setItem(STORAGE_KEYS.HANDOFFS, JSON.stringify(newHandoffs));
      if (newAudit) localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(newAudit));
      if (newEscalations) localStorage.setItem(STORAGE_KEYS.ESCALATIONS, JSON.stringify(newEscalations));
    } catch (e) {
      console.warn('Failed to persist to localStorage:', e);
    }
  };

  const logAudit = (
    entity: AuditLogEntry['entity'],
    entityId: string,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
    note: string
  ) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      entity,
      entity_id: entityId,
      before,
      after,
      note,
      created_at: new Date().toISOString(),
      actor: 'Officer Sarah (Municipal Admin)'
    };
    setAuditLogs(prev => {
      const updated = [entry, ...prev];
      persistState(undefined, undefined, undefined, updated);
      return updated;
    });
  };

  const getMergedComplaint = (idOrShortId: string): MergedComplaintView | undefined => {
    const complaint = complaints.find(c => c.id === idOrShortId || c.shortId === idOrShortId);
    if (!complaint) return undefined;

    const id = complaint.id;
    const analysis = analyses[id] || {
      complaint_id: id,
      summary: complaint.title || complaint.text.substring(0, 90) + '...',
      category: complaint.category || 'General',
      priority: 'Medium',
      priority_evidence: ['Automated heuristic keyword match'],
      department_id: 'dept-roads',
      action: 'Dispatch inspection crew within 48h',
      uncertainties: [],
      method: 'ai',
      confidence: 0.85
    };

    const decision = decisions[id];
    const member = incidentMembers.find(m => m.complaint_id === id);
    const compHandoffs = handoffs.filter(h => h.complaint_id === id);

    const currentStatus: StatusType = decision?.status || (id === 'GRV-2026-1001' ? 'Pending Review' : 'Pending');
    const currentPriority: PriorityType = decision?.priority || analysis.priority;
    const currentDepartmentId = decision?.department_id || analysis.department_id;
    const currentCategory = decision?.category || complaint.category || analysis.category;

    const isOverridden = !!decision && (
      decision.priority !== analysis.priority ||
      decision.department_id !== analysis.department_id ||
      decision.category !== analysis.category
    );

    const needsHumanReview = currentPriority === 'Critical' || currentPriority === 'High' || analysis.confidence < 0.75;

    return {
      complaint,
      analysis,
      decision,
      currentStatus,
      currentPriority,
      currentDepartmentId,
      currentCategory,
      isOverridden,
      needsHumanReview,
      incidentGroupId: member?.group_id,
      incidentScore: member?.score,
      incidentRelationship: member?.relationship_status,
      handoffs: compHandoffs,
      attachments: complaint.attachments,
      resolutionEvidence: resolutionEvidences[id]
    };
  };

  const mergedComplaints = useMemo(() => {
    return complaints.map(c => getMergedComplaint(c.id)!);
  }, [complaints, analyses, decisions, incidentMembers, handoffs, resolutionEvidences]);

  const filteredComplaints = useMemo(() => {
    return mergedComplaints.filter(m => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = m.complaint.text.toLowerCase().includes(q);
        const matchesTitle = m.complaint.title?.toLowerCase().includes(q);
        const matchesId = m.complaint.id.toLowerCase().includes(q) || m.complaint.shortId.toLowerCase().includes(q);
        const matchesLoc = m.complaint.location.toLowerCase().includes(q);
        if (!matchesText && !matchesTitle && !matchesId && !matchesLoc) return false;
      }

      if (categoryFilter !== 'ALL' && m.currentCategory !== categoryFilter) {
        return false;
      }

      if (priorityFilter !== 'ALL' && m.currentPriority !== priorityFilter) {
        return false;
      }

      if (statusFilter !== 'ALL' && m.currentStatus !== statusFilter) {
        return false;
      }

      if (channelFilter !== 'ALL' && m.complaint.source !== channelFilter) {
        return false;
      }

      if (demoFilter === 'DEMO' && !m.complaint.is_demo) {
        return false;
      }

      if (demoFilter === 'OFFICIAL' && m.complaint.is_demo) {
        return false;
      }

      if (needsReviewOnly && !m.needsHumanReview) {
        return false;
      }

      return true;
    });
  }, [mergedComplaints, searchQuery, categoryFilter, priorityFilter, statusFilter, channelFilter, demoFilter, needsReviewOnly]);

  const openComplaintDetail = (id: string) => {
    const found = complaints.find(c => c.id === id || c.shortId === id);
    if (found) {
      setSelectedComplaintId(found.id);
      setActiveTab('complaints');
      setShowDetail(true);
    }
  };

  const approveComplaint = (id: string, note?: string) => {
    const existing = getMergedComplaint(id);
    if (!existing) return;

    const beforeState = existing.decision ? { ...existing.decision } : null;
    const newDecision: Decision = {
      complaint_id: existing.complaint.id,
      category: existing.currentCategory,
      priority: existing.currentPriority,
      department_id: existing.currentDepartmentId,
      action: existing.analysis.action,
      status: 'Approved',
      reviewer_note: note || 'Approved recommendation without modification by Officer Sarah.',
      decided_at: new Date().toISOString()
    };

    setDecisions(prev => {
      const updated = { ...prev, [existing.complaint.id]: newDecision };
      persistState(updated);
      return updated;
    });

    logAudit('decision', existing.complaint.shortId, beforeState, newDecision as unknown as Record<string, unknown>, newDecision.reviewer_note);

    if (typeof window !== 'undefined') {
      fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: existing.complaint.shortId || existing.complaint.id,
          approved_category: existing.currentCategory,
          approved_priority: existing.currentPriority === 'Critical' ? 'Urgent' : existing.currentPriority,
          approved_department_id: existing.currentDepartmentId,
          status: 'Approved',
          reviewer_note: newDecision.reviewer_note,
        }),
      }).catch(err => console.warn('Backend /api/review sync notice:', err));
    }
  };

  const editAndOverrideComplaint = (
    id: string,
    updates: {
      category: string;
      priority: PriorityType;
      departmentId: string;
      action: string;
      note: string;
    }
  ) => {
    const existing = getMergedComplaint(id);
    if (!existing) return;

    const beforeState = existing.decision ? { ...existing.decision } : null;
    const newDecision: Decision = {
      complaint_id: existing.complaint.id,
      category: updates.category,
      priority: updates.priority,
      department_id: updates.departmentId,
      action: updates.action,
      status: 'Approved',
      reviewer_note: updates.note || 'Reviewer manually modified classification / routing.',
      decided_at: new Date().toISOString()
    };

    setDecisions(prev => {
      const updated = { ...prev, [existing.complaint.id]: newDecision };
      persistState(updated);
      return updated;
    });

    logAudit(
      'decision',
      existing.complaint.shortId,
      beforeState,
      newDecision as unknown as Record<string, unknown>,
      `Reviewer override: ${updates.note || 'Adjusted triage parameters'}`
    );

    if (typeof window !== 'undefined') {
      fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: existing.complaint.shortId || existing.complaint.id,
          approved_category: updates.category,
          approved_priority: updates.priority === 'Critical' ? 'Urgent' : updates.priority,
          approved_department_id: updates.departmentId,
          status: 'Approved',
          reviewer_note: updates.note,
          override_reason: updates.note,
        }),
      }).catch(err => console.warn('Backend /api/review override sync notice:', err));
    }
  };

  const rejectComplaint = (id: string, reason: string) => {
    const existing = getMergedComplaint(id);
    if (!existing) return;

    const beforeState = existing.decision ? { ...existing.decision } : null;
    const newDecision: Decision = {
      complaint_id: existing.complaint.id,
      category: existing.currentCategory,
      priority: existing.currentPriority,
      department_id: existing.currentDepartmentId,
      action: 'None (Rejected / Out of Scope)',
      status: 'Rejected',
      reviewer_note: reason || 'Grievance rejected by reviewer.',
      decided_at: new Date().toISOString()
    };

    setDecisions(prev => {
      const updated = { ...prev, [existing.complaint.id]: newDecision };
      persistState(updated);
      return updated;
    });

    logAudit('decision', existing.complaint.shortId, beforeState, newDecision as unknown as Record<string, unknown>, `Rejected: ${reason}`);
  };

  const requestMoreInfo = (id: string, note: string) => {
    const existing = getMergedComplaint(id);
    if (!existing) return;

    const beforeState = existing.decision ? { ...existing.decision } : null;
    const newDecision: Decision = {
      complaint_id: existing.complaint.id,
      category: existing.currentCategory,
      priority: existing.currentPriority,
      department_id: existing.currentDepartmentId,
      action: 'Awaiting Citizen Clarification',
      status: 'Needs More Information',
      reviewer_note: note || 'Requested supplementary details from citizen.',
      decided_at: new Date().toISOString()
    };

    setDecisions(prev => {
      const updated = { ...prev, [existing.complaint.id]: newDecision };
      persistState(updated);
      return updated;
    });

    logAudit('decision', existing.complaint.shortId, beforeState, newDecision as unknown as Record<string, unknown>, `Requested Info: ${note}`);
  };

  const updateStatus = (id: string, newStatus: StatusType, note?: string) => {
    const existing = getMergedComplaint(id);
    if (!existing) return;

    const beforeState = existing.decision ? { ...existing.decision } : null;
    const newDecision: Decision = {
      complaint_id: existing.complaint.id,
      category: existing.currentCategory,
      priority: existing.currentPriority,
      department_id: existing.currentDepartmentId,
      action: existing.analysis.action,
      status: newStatus,
      reviewer_note: note || `Status transitioned to ${newStatus}`,
      decided_at: new Date().toISOString()
    };

    setDecisions(prev => {
      const updated = { ...prev, [existing.complaint.id]: newDecision };
      persistState(updated);
      return updated;
    });

    logAudit('decision', existing.complaint.shortId, beforeState, newDecision as unknown as Record<string, unknown>, `Status changed: ${newStatus} (${note || ''})`);
  };

  const confirmIncidentMember = (groupId: string, complaintId: string) => {
    setIncidentMembers(prev => {
      const updated = prev.map(m =>
        (m.group_id === groupId || !m.group_id) && m.complaint_id === complaintId
          ? { ...m, relationship_status: 'confirmed' as const }
          : m
      );
      // If not present in members yet, add it
      if (!updated.some(m => m.complaint_id === complaintId)) {
        updated.push({ group_id: groupId, complaint_id: complaintId, score: 0.85, relationship_status: 'confirmed' });
      }
      persistState(undefined, updated);
      return updated;
    });

    const targetComp = complaints.find(c => c.id === complaintId || c.shortId === complaintId);
    logAudit(
      'incident_group',
      groupId,
      { complaint_id: complaintId, previous: 'suggested' },
      { complaint_id: complaintId, status: 'confirmed' },
      `Officer confirmed incident link for #${targetComp?.shortId || complaintId}.`
    );
  };

  const rejectIncidentMember = (groupId: string, complaintId: string) => {
    setIncidentMembers(prev => {
      const updated = prev.map(m =>
        (m.group_id === groupId || !m.group_id) && m.complaint_id === complaintId
          ? { ...m, relationship_status: 'rejected' as const }
          : m
      );
      if (!updated.some(m => m.complaint_id === complaintId)) {
        updated.push({ group_id: groupId, complaint_id: complaintId, score: 0.40, relationship_status: 'rejected' });
      }
      persistState(undefined, updated);
      return updated;
    });

    const targetComp = complaints.find(c => c.id === complaintId || c.shortId === complaintId);
    logAudit(
      'incident_group',
      groupId,
      { complaint_id: complaintId, previous: 'suggested' },
      { complaint_id: complaintId, status: 'rejected' },
      `Officer unlinked complaint #${targetComp?.shortId || complaintId} from cluster.`
    );
  };

  const createHandoff = (h: Omit<Handoff, 'id' | 'created_at'>) => {
    const newHandoff: Handoff = {
      ...h,
      id: `hnd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };

    setHandoffs(prev => {
      const updated = [newHandoff, ...prev];
      persistState(undefined, undefined, updated);
      return updated;
    });

    if (h.status === 'Initiated') {
      updateStatus(h.complaint_id, 'Contact Initiated', `Dispatched to ${h.department_id} via ${h.channel}`);
    }

    logAudit(
      'handoff',
      newHandoff.id,
      null,
      newHandoff as unknown as Record<string, unknown>,
      `Department handoff dispatched: ${h.channel} -> ${h.department_id}`
    );
  };

  const escalateComplaint = (
    id: string,
    level: 'Level 1' | 'Level 2' | 'Level 3',
    reason: string,
    followUpAt: string
  ) => {
    const existing = getMergedComplaint(id);
    if (!existing) return;

    const newHandoff: Handoff = {
      id: `esc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      complaint_id: existing.complaint.id,
      department_id: existing.currentDepartmentId,
      channel: 'portal',
      message: `ESCALATION ${level.toUpperCase()}: ${reason}`,
      status: 'Initiated',
      follow_up_at: followUpAt,
      type: 'escalation',
      escalation_level: level,
      escalation_reason: reason,
      created_at: new Date().toISOString()
    };

    setHandoffs(prev => {
      const updated = [newHandoff, ...prev];
      persistState(undefined, undefined, updated);
      return updated;
    });

    const numericLvl = level === 'Level 3' ? 3 : level === 'Level 2' ? 2 : 1;
    const newEscItem: EscalationItem = {
      id: `esc-item-${Date.now()}`,
      complaintId: existing.complaint.id,
      shortId: existing.complaint.shortId,
      issue: existing.complaint.title || existing.analysis.summary,
      level: numericLvl,
      daysOpen: 1,
      status: 'Escalated',
      department: existing.currentDepartmentId
    };

    setEscalations(prev => {
      const updated = [newEscItem, ...prev.filter(e => e.complaintId !== existing.complaint.id)];
      persistState(undefined, undefined, undefined, undefined, updated);
      return updated;
    });

    updateStatus(existing.complaint.id, 'Escalated', `${level} Escalation: ${reason}`);

    logAudit(
      'handoff',
      newHandoff.id,
      null,
      newHandoff as unknown as Record<string, unknown>,
      `Urgent ${level} Escalation created for #${existing.complaint.shortId}: ${reason}`
    );
  };

  const resetDemoData = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.DECISIONS);
        localStorage.removeItem(STORAGE_KEYS.MEMBERS);
        localStorage.removeItem(STORAGE_KEYS.HANDOFFS);
        localStorage.removeItem(STORAGE_KEYS.AUDIT);
        localStorage.removeItem(STORAGE_KEYS.ESCALATIONS);
      } catch (e) {
        console.warn('Failed clearing localStorage:', e);
      }
    }

    setDecisions(SEED_DECISIONS);
    setIncidentMembers(SEED_INCIDENT_MEMBERS);
    setHandoffs(SEED_HANDOFFS);
    setAuditLogs(SEED_AUDIT_LOGS);
    setEscalations(SEED_ESCALATIONS);
    setSelectedComplaintId('GRV-2026-1001');
    setActiveTab('overview');
    setShowDetail(false);
    setSearchQuery('');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setNeedsReviewOnly(false);

    logAudit(
      'decision',
      'SYSTEM',
      null,
      { action: 'RESET_DEMO' },
      'Reset Demo Data action triggered. Initial reference state restored.'
    );

    if (typeof window !== 'undefined') {
      fetch('/api/reset-demo', { method: 'POST' }).catch(err => console.warn('Backend /api/reset-demo sync notice:', err));
    }
  };

  const submitComplaint = async (data: {
    title?: string;
    text: string;
    location: string;
    category?: string;
    source?: Complaint['source'];
  }): Promise<Complaint> => {
    const count = complaints.length + 1;
    const shortNum = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const newId = `GRV-2026-${1000 + count}`;
    const cat = data.category || 'Water Supply & Sewage';
    const created: Complaint = {
      id: newId,
      shortId: `CMP-${shortNum}`,
      title: data.title || `${cat} in ${data.location}`,
      text: data.text,
      location: data.location,
      source: data.source || 'Web Portal',
      created_at: new Date().toISOString(),
      category: cat
    };

    const newAnalysis: Analysis = {
      complaint_id: newId,
      summary: created.title || created.text.substring(0, 80) + '...',
      category: cat,
      priority: 'High',
      priority_evidence: [
        'Direct citizen grievance registration',
        `Ward/Location reported: ${data.location}`,
        'Matched municipal keyword rules'
      ],
      department_id: cat.includes('Water') ? 'dept-water' : cat.includes('Garbage') ? 'dept-sanitation' : cat.includes('Light') ? 'dept-power' : 'dept-roads',
      action: 'Dispatch field triage crew within 24h',
      uncertainties: [],
      method: 'ai',
      confidence: 0.91
    };

    setComplaints(prev => [created, ...prev]);
    setAnalyses(prev => ({ ...prev, [newId]: newAnalysis }));
    setSelectedComplaintId(newId);

    logAudit(
      'complaint',
      newId,
      null,
      created as unknown as Record<string, unknown>,
      'New citizen grievance registered with language preferences'
    );

    return created;
  };

  const updateComplaintLocation = (id: string, lat: number, lng: number, locationName?: string) => {
    setComplaints(prev =>
      prev.map(c => {
        if (c.id === id || c.shortId === id) {
          return {
            ...c,
            lat,
            lng,
            location: locationName || c.location,
          };
        }
        return c;
      })
    );

    logAudit(
      'complaint',
      id,
      null,
      { lat, lng, location: locationName },
      `Geographic coordinates assigned: [${lat}, ${lng}]`
    );
  };

  const addAttachmentToComplaint = (id: string, attachment: ComplaintAttachment) => {
    setComplaints(prev =>
      prev.map(c => {
        if (c.id === id || c.shortId === id) {
          const existing = c.attachments || [];
          return {
            ...c,
            attachments: [attachment, ...existing],
          };
        }
        return c;
      })
    );

    logAudit(
      'complaint',
      id,
      null,
      { attachment_id: attachment.id, attachment_name: attachment.name },
      `Citizen uploaded photographic evidence: ${attachment.name}`
    );
  };

  const reanalyzeWithVision = (
    id: string,
    visionResult: {
      observations: string[];
      inferred_relevance: string;
      method: MethodType;
      confidence: number;
      updated_summary: string;
    }
  ) => {
    setAnalyses(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: {
          ...existing,
          summary: visionResult.updated_summary,
          priority_evidence: [
            ...visionResult.observations.map(o => `Visual Evidence: ${o}`),
            ...existing.priority_evidence,
          ],
          image_analysis: visionResult.inferred_relevance,
          method: visionResult.method,
          confidence: Math.max(existing.confidence, visionResult.confidence),
          last_analyzed_at: new Date().toISOString(),
        },
      };
    });

    logAudit(
      'complaint',
      id,
      null,
      { method: visionResult.method, observations: visionResult.observations },
      `Grievance re-analyzed with multi-modal visual inspection engine (${visionResult.method}).`
    );
  };

  const submitResolutionEvidence = (
    id: string,
    evidence: {
      note: string;
      officer_name: string;
      department_id?: string;
      action_taken?: string;
      work_order_ref?: string;
      photo_url?: string;
      photo_name?: string;
    }
  ) => {
    const existing = getMergedComplaint(id);
    const complaintId = existing?.complaint.id || id;
    const targetDept = evidence.department_id || existing?.currentDepartmentId || 'dept-roads';

    const evidenceRecord: ResolutionEvidence = {
      complaint_id: complaintId,
      submitted_at: new Date().toISOString(),
      officer_name: evidence.officer_name || 'Field Officer',
      department_id: targetDept,
      action_taken: evidence.action_taken || evidence.note,
      work_order_ref: evidence.work_order_ref,
      photo_url: evidence.photo_url,
      photo_name: evidence.photo_name,
      notes: evidence.note,
      status: 'submitted',
      stage: 'department_reported_resolved'
    };

    setResolutionEvidences(prev => {
      const updated = { ...prev, [complaintId]: evidenceRecord };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.RESOLUTIONS, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    // Case transitions to 'Verification Pending' upon resolution submission (never auto-verified)
    updateStatus(complaintId, 'Verification Pending', `Department reported resolved: ${evidence.action_taken || evidence.note}`);

    logAudit(
      'resolution',
      complaintId,
      { status: existing?.currentStatus || 'In Progress' },
      { status: 'Verification Pending', evidence: evidenceRecord as unknown as Record<string, unknown> },
      `Resolution submitted by ${evidence.officer_name} (${targetDept}). Verification Pending.`
    );

    if (typeof window !== 'undefined') {
      fetch('/api/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaintId,
          department_id: targetDept,
          officer_name: evidence.officer_name,
          action_taken: evidence.action_taken || evidence.note,
          work_order_ref: evidence.work_order_ref,
          notes: evidence.note,
          photo_url: evidence.photo_url,
          photo_name: evidence.photo_name
        })
      }).catch(err => console.warn('Backend /api/resolution notice:', err));
    }
  };

  const verifyResolution = (
    id: string,
    reviewer: string,
    note?: string,
    allowException?: boolean,
    exceptionReason?: string
  ) => {
    const existing = getMergedComplaint(id);
    const complaintId = existing?.complaint.id || id;
    const currentEvidence = resolutionEvidences[complaintId];

    const hasEvidence = !!(currentEvidence?.photo_url || currentEvidence?.work_order_ref || currentEvidence?.action_taken);
    if (!hasEvidence && !allowException) {
      throw new Error('Verification requires photographic or work-order evidence, or an explicit documented policy exception reason.');
    }

    const updatedEvidence: ResolutionEvidence = {
      ...(currentEvidence || {
        complaint_id: complaintId,
        submitted_at: new Date().toISOString(),
        officer_name: 'Field Department',
        department_id: existing?.currentDepartmentId || 'dept-roads',
        notes: 'Verification exception approval'
      }),
      status: 'verified',
      stage: 'verified_resolved',
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
      verification_note: note || 'Resolution reviewed and verified.',
      exception_documented: !!allowException,
      exception_reason: exceptionReason
    };

    setResolutionEvidences(prev => {
      const updated = { ...prev, [complaintId]: updatedEvidence };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.RESOLUTIONS, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    updateStatus(complaintId, 'Verified Resolved', `Resolution verified by ${reviewer}`);

    logAudit(
      'resolution',
      complaintId,
      { status: 'Verification Pending' },
      { status: 'Verified Resolved', reviewer, note, allowException, exceptionReason },
      `Resolution verified by ${reviewer}. Status transitioned to Verified Resolved.`
    );

    if (typeof window !== 'undefined') {
      fetch('/api/resolution', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaintId,
          action: 'VERIFY_RESOLVED',
          reviewer,
          note,
          allow_exception: allowException,
          exception_reason: exceptionReason
        })
      }).catch(err => console.warn('Backend /api/resolution sync notice:', err));
    }
  };

  const rejectResolution = (id: string, reason: string, reviewer?: string) => {
    const existing = getMergedComplaint(id);
    const complaintId = existing?.complaint.id || id;
    const reviewerName = reviewer || 'Officer Sarah (Municipal Admin)';
    const currentEvidence = resolutionEvidences[complaintId];

    const updatedEvidence: ResolutionEvidence = {
      ...(currentEvidence || {
        complaint_id: complaintId,
        submitted_at: new Date().toISOString(),
        officer_name: 'Field Department',
        department_id: existing?.currentDepartmentId || 'dept-roads'
      }),
      status: 'rejected',
      stage: 'rejected_further_action',
      reviewed_by: reviewerName,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason
    };

    setResolutionEvidences(prev => {
      const updated = { ...prev, [complaintId]: updatedEvidence };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.RESOLUTIONS, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    updateStatus(complaintId, 'Rejected — Further Action Required', `Resolution rejected: ${reason}`);

    logAudit(
      'resolution',
      complaintId,
      { status: existing?.currentStatus || 'Verification Pending' },
      { status: 'Rejected — Further Action Required', reason, reviewer: reviewerName },
      `Resolution rejected by ${reviewerName}: ${reason}`
    );

    if (typeof window !== 'undefined') {
      fetch('/api/resolution', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaintId,
          action: 'REJECT_RESOLUTION',
          reviewer: reviewerName,
          reason
        })
      }).catch(err => console.warn('Backend /api/resolution sync notice:', err));
    }
  };

  const reopenComplaint = (id: string, reason: string, reviewer?: string) => {
    const existing = getMergedComplaint(id);
    const complaintId = existing?.complaint.id || id;
    const reviewerName = reviewer || 'Officer Sarah (Municipal Admin)';
    const currentEvidence = resolutionEvidences[complaintId];

    const updatedEvidence: ResolutionEvidence = {
      ...(currentEvidence || {
        complaint_id: complaintId,
        submitted_at: new Date().toISOString(),
        officer_name: 'Field Department',
        department_id: existing?.currentDepartmentId || 'dept-roads'
      }),
      status: 'disputed',
      citizen_feedback: 'disputed',
      citizen_dispute_reason: reason
    };

    setResolutionEvidences(prev => {
      const updated = { ...prev, [complaintId]: updatedEvidence };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.RESOLUTIONS, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    updateStatus(complaintId, 'Reopened', `Case reopened: ${reason}`);

    logAudit(
      'resolution',
      complaintId,
      { status: existing?.currentStatus },
      { status: 'Reopened', reason, reopened_by: reviewerName },
      `Case reopened by ${reviewerName}: ${reason}. Historical resolution records preserved.`
    );

    if (typeof window !== 'undefined') {
      fetch('/api/resolution', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaintId,
          action: 'REOPEN',
          reviewer: reviewerName,
          reason
        })
      }).catch(err => console.warn('Backend /api/resolution sync notice:', err));
    }
  };

  const registerOfficerComplaint = async (data: {
    text: string;
    location: string;
    ward?: string;
    lat?: number;
    lng?: number;
    source: IntakeChannel;
    category?: string;
    date_received?: string;
    reporting_person?: { name?: string; contact?: string };
    source_reference?: string;
    receiving_officer?: string;
    officer_notes?: string;
    attachments?: ComplaintAttachment[];
  }): Promise<Complaint> => {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register officer complaint');
    }

    const result = await res.json();
    const newComplaint = result.complaint as Complaint;
    const newAnalysis = result.analysis as Analysis;

    setComplaints(prev => [newComplaint, ...prev.filter(c => c.id !== newComplaint.id)]);
    if (newAnalysis) {
      setAnalyses(prev => ({ ...prev, [newComplaint.id]: newAnalysis }));
    }
    setSelectedComplaintId(newComplaint.id);
    setShowDetail(true);

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.MANUAL_COMPLAINTS);
        const parsed: Complaint[] = stored ? JSON.parse(stored) : [];
        localStorage.setItem(STORAGE_KEYS.MANUAL_COMPLAINTS, JSON.stringify([newComplaint, ...parsed.filter(c => c.id !== newComplaint.id)]));
      } catch (e) {}
    }

    logAudit(
      'intake',
      newComplaint.id,
      null,
      newComplaint as unknown as Record<string, unknown>,
      `Manual complaint registered by ${data.receiving_officer || 'Municipal Officer'} via ${data.source}. Unique ID: ${newComplaint.id}`
    );

    return newComplaint;
  };

  const importCsvComplaints = async (
    rows: Array<{
      text: string;
      location: string;
      ward?: string;
      category?: string;
      priority?: PriorityType;
      source_reference?: string;
    }>,
    importingOfficer?: string
  ) => {
    const res = await fetch('/api/complaints/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows,
        importing_officer: importingOfficer || 'Officer Sarah (Municipal Admin)'
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to import CSV complaints');
    }

    const data = await res.json();
    if (data.complaints && Array.isArray(data.complaints)) {
      setComplaints(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newOnes = data.complaints.filter((c: Complaint) => !existingIds.has(c.id));
        const updated = [...newOnes, ...prev];
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem(STORAGE_KEYS.MANUAL_COMPLAINTS);
            const parsed: Complaint[] = stored ? JSON.parse(stored) : [];
            localStorage.setItem(STORAGE_KEYS.MANUAL_COMPLAINTS, JSON.stringify([...newOnes, ...parsed]));
          } catch (e) {}
        }
        return updated;
      });

      if (data.analyses && typeof data.analyses === 'object') {
        setAnalyses(prev => ({ ...prev, ...data.analyses }));
      }
    }

    logAudit(
      'intake',
      data.batch_id || `batch-${Date.now()}`,
      null,
      data.summary,
      `CSV batch import completed: ${data.summary?.imported || 0} imported, ${data.summary?.duplicates || 0} duplicates skipped, ${data.summary?.failed || 0} failed.`
    );

    return {
      successCount: data.summary?.imported || 0,
      duplicateCount: data.summary?.duplicates || 0,
      failedCount: data.summary?.failed || 0,
      message: data.message || `CSV import successful (${data.summary?.imported || 0} imported).`
    };
  };

  const disputeOrReopenResolution = (id: string, reason: string) => {
    reopenComplaint(id, reason, 'Citizen / Field Escalation');
  };

  const replyInformationRequest = (
    id: string,
    replyText: string,
    photoAttachment?: ComplaintAttachment
  ) => {
    if (photoAttachment) {
      addAttachmentToComplaint(id, photoAttachment);
    }
    updateStatus(id, 'Under Review', `Citizen supplied requested details: ${replyText}`);

    setAnalyses(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: {
          ...existing,
          summary: `${existing.summary} [Citizen Response: ${replyText.slice(0, 75)}]`,
          priority_evidence: [
            `Citizen Response Evidence: ${replyText.slice(0, 60)}`,
            ...existing.priority_evidence,
          ],
          last_analyzed_at: new Date().toISOString(),
        },
      };
    });

    logAudit(
      'info_request',
      id,
      { status: 'Pending' },
      { status: 'Responded', reply: replyText },
      `Citizen submitted reply: "${replyText}"`
    );
  };

  const getAuditLogsForComplaint = (complaintId: string): AuditLogEntry[] => {
    return auditLogs.filter(
      a =>
        a.entity_id === complaintId ||
        (a.after as any)?.complaint?.id === complaintId ||
        (a.after as any)?.complaint_id === complaintId
    );
  };

  return (
    <TriageContext.Provider
      value={{
        departments,
        complaints,
        analyses,
        decisions,
        incidentGroups,
        incidentMembers,
        handoffs,
        auditLogs,
        escalations,
        selectedComplaintId,
        activeTab,
        showDetail,
        searchQuery,
        categoryFilter,
        priorityFilter,
        statusFilter,
        channelFilter,
        demoFilter,
        needsReviewOnly,
        isHydrated,
        settings,
        setSelectedComplaintId,
        setActiveTab,
        setShowDetail,
        setSearchQuery,
        setCategoryFilter,
        setPriorityFilter,
        setStatusFilter,
        setChannelFilter,
        setDemoFilter,
        setNeedsReviewOnly,
        updateSettings,
        openComplaintDetail,
        approveComplaint,
        editAndOverrideComplaint,
        rejectComplaint,
        requestMoreInfo,
        updateStatus,
        confirmIncidentMember,
        rejectIncidentMember,
        createHandoff,
        escalateComplaint,
        submitComplaint,
        registerOfficerComplaint,
        importCsvComplaints,
        resetDemoData,
        t,
        getMergedComplaint,
        mergedComplaints,
        filteredComplaints,
        updateComplaintLocation,
        addAttachmentToComplaint,
        reanalyzeWithVision,
        submitResolutionEvidence,
        verifyResolution,
        rejectResolution,
        reopenComplaint,
        disputeOrReopenResolution,
        replyInformationRequest,
        getAuditLogsForComplaint
      }}
    >
      {children}
    </TriageContext.Provider>
  );
}

export function useTriage() {
  const context = useContext(TriageContext);
  if (!context) {
    throw new Error('useTriage must be used within a TriageProvider');
  }
  return context;
}