import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "../../../lib/db";
import { triageComplaint } from "../../../core/triage";

const ManualComplaintRegistrationSchema = z.object({
  text: z.string().min(5, "Complaint description must be at least 5 characters"),
  location: z.string().min(2, "Incident location is required"),
  ward: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  source: z
    .enum([
      "Phone",
      "Email",
      "In Person",
      "Existing Government Portal",
      "Other",
      "Web Portal",
      "Mobile App",
      "Citizen Helpline",
      "SMS Gateway",
      "Walk-in Desk",
      "CSV Import",
      "Integration API",
    ])
    .default("Phone"),
  category: z.string().optional(),
  date_received: z.string().optional(),
  reporting_person: z
    .object({
      name: z.string().optional(),
      contact: z.string().optional(),
    })
    .optional(),
  source_reference: z.string().optional(),
  receiving_officer: z.string().optional().default("Officer Sarah (Municipal Admin)"),
  officer_notes: z.string().optional(),
  attachments: z.array(z.any()).optional(),
});

// Cache recently submitted texts to prevent accidental double-click / network retry duplicates
const recentSubmissions = new Map<string, number>();

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(req.url);

    const filterStatus = searchParams.get("status");
    const filterCategory = searchParams.get("category");
    const filterPriority = searchParams.get("priority");
    const filterChannel = searchParams.get("channel");
    const filterDemo = searchParams.get("is_demo");
    const search = searchParams.get("search")?.toLowerCase();

    const complaints = await db.getComplaints();
    const analyses = await db.getAnalyses();
    const decisions = await db.getDecisions();
    const incidentMembers = await db.getIncidentMembers();

    const analysisMap = new Map(analyses.map((a) => [a.complaint_id, a]));
    const decisionMap = new Map(decisions.map((d) => [d.complaint_id, d]));
    const memberMap = new Map(incidentMembers.map((m) => [m.complaint_id, m]));

    let results = complaints.map((c) => {
      const analysis = analysisMap.get(c.id);
      const decision = decisionMap.get(c.id);
      const incidentMembership = memberMap.get(c.id);

      return {
        ...c,
        analysis: analysis || null,
        decision: decision || null,
        incident_group_id: incidentMembership?.group_id || null,
        incident_status: incidentMembership?.membership_status || null,
        status: decision?.status || "Pending Review",
        effective_category: decision?.approved_category || analysis?.category || "Unassigned",
        effective_priority: decision?.approved_priority || analysis?.priority || "Medium",
        effective_department_id: decision?.approved_department_id || analysis?.recommended_department_id || null,
        is_demo: (c as any).is_demo ?? false,
      };
    });

    if (filterStatus) {
      results = results.filter((r) => r.status.toLowerCase() === filterStatus.toLowerCase());
    }
    if (filterCategory) {
      results = results.filter((r) => r.effective_category.toLowerCase() === filterCategory.toLowerCase());
    }
    if (filterPriority) {
      results = results.filter((r) => r.effective_priority.toLowerCase() === filterPriority.toLowerCase());
    }
    if (filterChannel && filterChannel !== "ALL") {
      results = results.filter((r) => (r.source || "").toLowerCase() === filterChannel.toLowerCase());
    }
    if (filterDemo !== null && filterDemo !== undefined) {
      const isDemoBool = filterDemo === "true";
      results = results.filter((r) => r.is_demo === isDemoBool);
    }
    if (search) {
      results = results.filter(
        (r) =>
          r.text.toLowerCase().includes(search) ||
          r.location.toLowerCase().includes(search) ||
          r.id.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      complaints: results,
    });
  } catch (error: any) {
    console.error("GET /api/complaints error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ManualComplaintRegistrationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed on complaint registration",
          errors: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validated.data;
    const db = getDatabase();

    // Idempotency / duplicate check within 60s
    const dedupeKey = `${data.text.trim().toLowerCase()}|${data.location.trim().toLowerCase()}`;
    const lastSeen = recentSubmissions.get(dedupeKey);
    const now = Date.now();
    if (lastSeen && now - lastSeen < 60000) {
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          message: "Duplicate submission detected: identical complaint was submitted less than a minute ago.",
        },
        { status: 409 }
      );
    }
    recentSubmissions.set(dedupeKey, now);

    // Generate unique complaint ID
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `CMP-${year}-${randomSuffix}`;

    // Execute triage pipeline with genuine complaint text
    const triageResult = await triageComplaint({
      complaintId: newId,
      text: data.text,
      location: data.location,
      ward: data.ward,
      lat: data.lat,
      lng: data.lng,
      source: data.source,
      created_at: data.date_received || new Date().toISOString(),
      is_demo: false, // Real municipal registration
      reporting_person: data.reporting_person,
      source_reference: data.source_reference,
      receiving_officer: data.receiving_officer,
      officer_notes: data.officer_notes,
      attachments: data.attachments,
    });

    // Override category if manually specified by officer
    if (data.category && data.category !== "ALL" && data.category !== "Unassigned") {
      triageResult.analysis.category = data.category;
      await db.saveAnalysis(triageResult.analysis);
    }

    // Record genuine audit log
    await db.logAudit({
      entity_name: "complaint",
      entity_id: newId,
      action: "MANUAL_COMPLAINT_REGISTERED",
      before_state: null,
      after_state: {
        complaint: triageResult.complaint,
        analysis: triageResult.analysis,
        source: data.source,
        source_reference: data.source_reference,
        receiving_officer: data.receiving_officer,
      },
      reviewer: data.receiving_officer || "Officer Sarah (Municipal Admin)",
      actor: data.receiving_officer || "Officer Sarah (Municipal Admin)",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Complaint ${newId} registered and triaged successfully`,
        complaint: {
          ...triageResult.complaint,
          shortId: newId,
          is_demo: false,
        },
        analysis: triageResult.analysis,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/complaints error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to register complaint" },
      { status: 500 }
    );
  }
}
