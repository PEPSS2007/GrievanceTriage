import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "../../../lib/db";
import { validateStatusTransition } from "../../../core/state-machine";

const EscalateRequestSchema = z.object({
  complaint_id: z.string().min(1),
  level: z.number().int().min(1).max(3).default(1),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  follow_up_date: z.string().min(1, "Follow-up date is required"),
  reviewer: z.string().optional().default("Prototype Triage Reviewer"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = EscalateRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { complaint_id, level, reason, follow_up_date, reviewer } = validated.data;
    const db = getDatabase();

    const complaint = await db.getComplaintById(complaint_id);
    if (!complaint) {
      return NextResponse.json(
        { success: false, message: `Complaint ${complaint_id} not found` },
        { status: 404 }
      );
    }

    const existingDecision = await db.getDecisionByComplaintId(complaint_id);
    const currentStatus = existingDecision?.status || "Pending Review";

    // Validate that escalation transition is allowed from current state
    const transition = validateStatusTransition(currentStatus, "Escalated");
    if (!transition.allowed) {
      return NextResponse.json(
        { success: false, message: transition.message },
        { status: 422 }
      );
    }

    const escalation = {
      complaint_id,
      level,
      reason,
      follow_up_date,
      created_at: new Date().toISOString(),
    };

    await db.saveEscalation(escalation);

    // Update decision status to Escalated
    const updatedDecision = {
      complaint_id,
      approved_category: existingDecision?.approved_category || "Unassigned",
      approved_priority: existingDecision?.approved_priority || "Urgent",
      approved_department_id: existingDecision?.approved_department_id || "dept_roads",
      status: "Escalated" as const,
      reviewer_note: `Escalated Level ${level}: ${reason}`,
      override_reason: reason,
      decided_at: new Date().toISOString(),
    };
    await db.saveDecision(updatedDecision);

    // Write audit log
    await db.logAudit({
      entity_name: "escalation",
      entity_id: complaint_id,
      action: `COMPLAINT_ESCALATED_L${level}`,
      before_state: existingDecision ? (existingDecision as any) : null,
      after_state: { escalation, decision: updatedDecision },
      reviewer,
    });

    return NextResponse.json({
      success: true,
      escalation,
      decision: updatedDecision,
    });
  } catch (error: any) {
    console.error("POST /api/escalate error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
