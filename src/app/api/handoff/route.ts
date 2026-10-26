import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "../../../lib/db";
import { HandoffChannelEnum, HandoffStatusEnum } from "../../../contracts";
import { validateStatusTransition } from "../../../core/state-machine";

const HandoffRequestSchema = z.object({
  complaint_id: z.string().min(1),
  department_id: z.string().min(1),
  channel: HandoffChannelEnum.default("email"),
  message_draft: z.string().min(1),
  status: HandoffStatusEnum.default("Prepared"),
  follow_up_date: z.string().optional(),
  reviewer: z.string().optional().default("Prototype Triage Reviewer"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = HandoffRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      complaint_id,
      department_id,
      channel,
      message_draft,
      status,
      follow_up_date,
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

    const department = await db.getDepartmentById(department_id);
    if (!department) {
      return NextResponse.json(
        { success: false, message: `Department ${department_id} not found` },
        { status: 404 }
      );
    }

    const existingDecision = await db.getDecisionByComplaintId(complaint_id);
    const currentStatus = existingDecision?.status || "Approved";

    // Map handoff status to complaint lifecycle status
    let targetComplaintStatus = currentStatus;
    if (status === "Prepared") targetComplaintStatus = "Contact Prepared";
    if (status === "Initiated") targetComplaintStatus = "Contact Initiated";
    if (status === "Acknowledged") targetComplaintStatus = "Acknowledged";

    const transition = validateStatusTransition(currentStatus, targetComplaintStatus);
    if (!transition.allowed) {
      return NextResponse.json(
        { success: false, message: transition.message },
        { status: 422 }
      );
    }

    const handoffId = `HND-${Date.now()}`;
    const handoff = {
      id: handoffId,
      complaint_id,
      department_id,
      channel,
      message_draft,
      status,
      follow_up_date,
      created_at: new Date().toISOString(),
    };

    await db.saveHandoff(handoff);

    // Update decision status
    const updatedDecision = {
      complaint_id,
      approved_category: existingDecision?.approved_category || "Unassigned",
      approved_priority: existingDecision?.approved_priority || "Medium",
      approved_department_id: department_id,
      status: targetComplaintStatus,
      reviewer_note: `Handoff ${status.toLowerCase()} to ${department.name} via ${channel}.`,
      decided_at: new Date().toISOString(),
    };
    await db.saveDecision(updatedDecision);

    // Log audit
    await db.logAudit({
      entity_name: "handoff",
      entity_id: handoffId,
      action: `HANDOFF_${status.toUpperCase()}`,
      before_state: existingDecision ? (existingDecision as any) : null,
      after_state: { handoff, decision: updatedDecision },
      reviewer,
    });

    return NextResponse.json({
      success: true,
      handoff,
      decision: updatedDecision,
    });
  } catch (error: any) {
    console.error("POST /api/handoff error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
