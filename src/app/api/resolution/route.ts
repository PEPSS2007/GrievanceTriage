import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '../../../lib/db';
import { validateStatusTransition } from '../../../core/state-machine';

const SubmitResolutionSchema = z.object({
  complaint_id: z.string().min(1),
  officer_name: z.string().min(1, 'Officer name required'),
  department_id: z.string().min(1, 'Department ID required'),
  action_taken: z.string().min(5, 'Action details must be at least 5 characters'),
  completed_at: z.string().optional(),
  after_photo_url: z.string().optional(),
  after_photo_name: z.string().optional(),
  work_order_ref: z.string().optional(),
});

const VerifyResolutionSchema = z.object({
  complaint_id: z.string().min(1),
  action: z.enum([
    'VERIFY_RESOLVED',
    'REJECT_RESOLUTION',
    'REOPEN',
    'CITIZEN_CONFIRM',
    'CITIZEN_DISPUTE_REOPEN',
    'POLICY_VERIFY',
  ]),
  reviewer: z.string().min(1),
  note: z.string().optional(),
  dispute_reason: z.string().optional(),
  rejection_reason: z.string().optional(),
  allow_exception: z.boolean().optional(),
  exception_reason: z.string().optional(),
});

// POST: Submit resolution evidence (Department Officer)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = SubmitResolutionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      complaint_id,
      officer_name,
      department_id,
      action_taken,
      completed_at,
      after_photo_url,
      after_photo_name,
      work_order_ref,
    } = validated.data;

    const db = getDatabase();
    const complaint = await db.getComplaintById(complaint_id);
    if (!complaint) {
      return NextResponse.json({ success: false, message: `Complaint ${complaint_id} not found` }, { status: 404 });
    }

    const existingDecision = await db.getDecisionByComplaintId(complaint_id);
    const currentStatus = existingDecision?.status || 'In Progress';

    // Transition to 'Verification Pending'
    const targetStatus = 'Verification Pending';
    const transition = validateStatusTransition(currentStatus, targetStatus as any);
    if (!transition.allowed) {
      return NextResponse.json(
        { success: false, message: `Cannot submit resolution: ${transition.message}` },
        { status: 422 }
      );
    }

    const resolutionEvidence = {
      id: `res-${Date.now()}`,
      complaint_id,
      officer_name,
      department_id,
      action_taken,
      work_order_ref: work_order_ref || null,
      completed_at: completed_at || new Date().toISOString(),
      after_photo_url: after_photo_url || null,
      after_photo_name: after_photo_name || null,
      status: 'submitted',
      stage: 'department_reported_resolved',
      verification_status: 'Verification Pending',
    };

    const updatedDecision = {
      complaint_id,
      approved_category: existingDecision?.approved_category || 'General',
      approved_priority: existingDecision?.approved_priority || 'Medium',
      approved_department_id: department_id,
      status: targetStatus as any,
      reviewer_note: `Department filed resolution: ${action_taken}. Verification pending review.`,
      decided_at: new Date().toISOString(),
    };

    await db.saveDecision(updatedDecision);

    // Record genuine audit log
    await db.logAudit({
      entity_name: 'resolution_evidence',
      entity_id: complaint_id,
      action: 'RESOLUTION_SUBMITTED_BY_DEPARTMENT',
      before_state: existingDecision ? (existingDecision as any) : null,
      after_state: {
        decision: updatedDecision,
        evidence: resolutionEvidence,
      },
      reviewer: officer_name,
      actor: officer_name,
    });

    return NextResponse.json({
      success: true,
      message: 'Resolution evidence submitted; complaint moved to Verification Pending',
      evidence: resolutionEvidence,
      decision: updatedDecision,
    });
  } catch (error: any) {
    console.error('POST /api/resolution error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Resolution submission failed' },
      { status: 500 }
    );
  }
}

// PATCH: Verify, Reject, or Reopen resolution (Authorized Reviewer)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = VerifyResolutionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      complaint_id,
      action,
      reviewer,
      note,
      dispute_reason,
      rejection_reason,
      allow_exception,
      exception_reason,
    } = validated.data;
    const db = getDatabase();

    const existingDecision = await db.getDecisionByComplaintId(complaint_id);
    const currentStatus = existingDecision?.status || 'Verification Pending';

    let targetStatus: any = 'Verified Resolved';
    let auditAction = 'RESOLUTION_VERIFIED';
    let reviewNote = note || 'Resolution inspected and verified by authorized reviewer.';

    if (action === 'VERIFY_RESOLVED') {
      targetStatus = 'Verified Resolved';
      auditAction = 'RESOLUTION_VERIFIED_RESOLVED';
      reviewNote = note || 'Physical resolution inspected and verified.';
    } else if (action === 'REJECT_RESOLUTION') {
      targetStatus = 'Rejected — Further Action Required';
      auditAction = 'RESOLUTION_REJECTED_FURTHER_ACTION';
      reviewNote = rejection_reason || note || 'Submitted resolution rejected: requires further remedial action.';
    } else if (action === 'REOPEN' || action === 'CITIZEN_DISPUTE_REOPEN') {
      targetStatus = 'Reopened';
      auditAction = 'RESOLUTION_REOPENED';
      reviewNote = dispute_reason || note || 'Issue reported persisting or resolution disputed; case reopened.';
    } else if (action === 'CITIZEN_CONFIRM') {
      targetStatus = 'Verified Resolved';
      auditAction = 'RESOLUTION_CITIZEN_CONFIRMED';
      reviewNote = 'Citizen confirmed issue successfully resolved.';
    } else if (action === 'POLICY_VERIFY') {
      targetStatus = 'Verified Resolved';
      auditAction = 'RESOLUTION_POLICY_VERIFIED';
      reviewNote = '72h citizen response window elapsed; verified under municipal closure policy.';
    }

    const transition = validateStatusTransition(currentStatus, targetStatus);
    if (!transition.allowed) {
      return NextResponse.json(
        { success: false, message: `Transition not allowed: ${transition.message}` },
        { status: 422 }
      );
    }

    const updatedDecision = {
      complaint_id,
      approved_category: existingDecision?.approved_category || 'General',
      approved_priority: existingDecision?.approved_priority || 'Medium',
      approved_department_id: existingDecision?.approved_department_id || 'dept_roads',
      status: targetStatus,
      reviewer_note: reviewNote,
      decided_at: new Date().toISOString(),
      reviewer,
    };

    await db.saveDecision(updatedDecision);

    await db.logAudit({
      entity_name: 'resolution_verification',
      entity_id: complaint_id,
      action: auditAction,
      before_state: existingDecision ? (existingDecision as any) : null,
      after_state: {
        ...updatedDecision,
        exception_documented: allow_exception || false,
        exception_reason: exception_reason || null,
      },
      reviewer,
      actor: reviewer,
    });

    return NextResponse.json({
      success: true,
      new_status: targetStatus,
      decision: updatedDecision,
      message: `Resolution status successfully updated to "${targetStatus}"`,
    });
  } catch (error: any) {
    console.error('PATCH /api/resolution error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Resolution verification update failed' },
      { status: 500 }
    );
  }
}
