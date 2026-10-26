import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '../../../lib/db';

const AuditPostSchema = z.object({
  entity_name: z.string().min(1),
  entity_id: z.string().min(1),
  action: z.string().min(1),
  before_state: z.record(z.unknown()).nullable().optional(),
  after_state: z.record(z.unknown()).nullable().optional(),
  reviewer: z.string().optional().default('Officer Reviewer (Demo)'),
  reviewer_note: z.string().optional(),
  override_reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const complaintId = searchParams.get('complaint_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const db = getDatabase();
    const logs = await db.getAuditLogs(limit, complaintId);

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
      demo_persistence_notice:
        'Audit events are recorded in-memory or in Postgres depending on Supabase configuration. In demo mode, logs persist until server restart.',
    });
  } catch (error: any) {
    console.error('GET /api/audit error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch audit history' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = AuditPostSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      entity_name,
      entity_id,
      action,
      before_state,
      after_state,
      reviewer,
      reviewer_note,
      override_reason,
    } = validated.data;

    const db = getDatabase();
    await db.logAudit({
      entity_name,
      entity_id,
      action,
      before_state: before_state || null,
      after_state: {
        ...(after_state || {}),
        reviewer_note,
        override_reason,
      },
      reviewer,
    });

    return NextResponse.json({
      success: true,
      message: 'Audit event persisted successfully',
    });
  } catch (error: any) {
    console.error('POST /api/audit error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to log audit event' },
      { status: 500 }
    );
  }
}
