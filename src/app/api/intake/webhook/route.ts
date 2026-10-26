import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '../../../../lib/db';
import { triageComplaint } from '../../../../core/triage';

const WebhookIntakeSchema = z.object({
  external_source: z.string().min(1, 'External source is required (e.g. CPGRAMS, WhatsApp Bot, State Portal)'),
  external_reference_id: z.string().min(1, 'External reference ID required for idempotency'),
  text: z.string().min(5, 'Complaint text must be at least 5 characters'),
  location: z.string().min(1, 'Location or ward is required'),
  category_hint: z.string().optional(),
  contact_phone: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate API Key or Bearer Token
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    // In demo mode, accept any non-empty bearer token or demo token; in production require GT_INTAKE_WEBHOOK_KEY
    const expectedKey = process.env.GT_INTAKE_WEBHOOK_KEY;
    if (expectedKey && token !== expectedKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or missing API Bearer token for External Webhook Intake.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = WebhookIntakeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      external_source,
      external_reference_id,
      text,
      location,
      category_hint,
      lat,
      lng,
    } = validated.data;

    const db = getDatabase();

    // 2. Check for duplicate external_reference_id
    const existingComplaints = await db.getComplaints();
    const isDuplicate = existingComplaints.some(
      (c: any) => c.external_reference_id === external_reference_id || c.text === text
    );

    if (isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate Record',
          message: `A grievance with reference ${external_reference_id} has already been ingested.`,
        },
        { status: 409 }
      );
    }

    // 3. Generate Unique Municipal ID
    const shortNum = (existingComplaints.length + 1).toString().padStart(3, '0');
    const complaintId = `GRV-2026-${1100 + existingComplaints.length}`;
    const shortId = `CMP-${shortNum}`;

    // 4. Run automated triage pipeline
    const triageResult = await triageComplaint({
      complaintId,
      text,
      location,
      source: 'Integration API',
    });

    const newComplaint = {
      id: complaintId,
      shortId,
      text,
      location,
      lat,
      lng,
      source: 'Integration API' as const,
      external_source,
      external_reference_id,
      created_at: new Date().toISOString(),
      category: category_hint || triageResult.analysis.category,
    };

    await db.createComplaint(newComplaint as any);
    await db.saveAnalysis(triageResult.analysis);

    // Initial review decision
    await db.saveDecision({
      complaint_id: complaintId,
      approved_category: triageResult.analysis.category,
      approved_priority: triageResult.analysis.priority as any,
      approved_department_id: triageResult.analysis.recommended_department_id,
      status: 'Submitted',
      reviewer_note: `Ingested via external webhook: ${external_source} (Ref: ${external_reference_id})`,
      decided_at: new Date().toISOString(),
    });

    // Write audit log
    await db.logAudit({
      entity_name: 'intake_webhook',
      entity_id: complaintId,
      action: 'EXTERNAL_WEBHOOK_INGESTION',
      before_state: null,
      after_state: {
        complaint: newComplaint,
        external_source,
        external_reference_id,
        analysis_method: triageResult.method,
      },
      reviewer: `Webhook Gateway (${external_source})`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Grievance ingested and triaged successfully via External Webhook',
        complaint: newComplaint,
        triage_analysis: triageResult.analysis,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/intake/webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: error?.message || 'Ingestion failed' },
      { status: 500 }
    );
  }
}
