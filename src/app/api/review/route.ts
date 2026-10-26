import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "../../../lib/db";
import { ComplaintPriorityEnum, ComplaintStatusEnum } from "../../../contracts";
import { validateStatusTransition } from "../../../core/state-machine";

const ReviewRequestSchema = z.object({
  complaint_id: z.string().min(1),
  approved_category: z.string().min(1),
  approved_priority: ComplaintPriorityEnum,
  approved_department_id: z.string().min(1),
  status: ComplaintStatusEnum.default("Approved"),
  reviewer_note: z.string().optional(),
  override_reason: z.string().optional(),
  reviewer: z.string().optional().default("Prototype Triage Reviewer"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ReviewRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      complaint_id,
      approved_category,
      approved_priority,
      approved_department_id,
      status,
      reviewer_note,
      override_reason,
      reviewer,
    } = validated.data;

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

    // Validate state transition
    const transition = validateStatusTransition(currentStatus, status);
    if (!transition.allowed) {
      return NextResponse.json(
        { success: false, message: transition.message },
        { status: 422 }
      );
    }

    const updatedDecision = {
      complaint_id,
      approved_category,
      approved_priority,
      approved_department_id,
      status,
      reviewer_note,
      override_reason,
      decided_at: new Date().toISOString(),
    };

    await db.saveDecision(updatedDecision);

    // Write audit log
    await db.logAudit({
      entity_name: "complaint_decision",
      entity_id: complaint_id,
      action: "REVIEW_DECISION_UPDATED",
      before_state: existingDecision ? (existingDecision as any) : null,
      after_state: updatedDecision,
      reviewer,
    });

    return NextResponse.json({
      success: true,
      decision: updatedDecision,
    });
  } catch (error: any) {
    console.error("POST /api/review error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
