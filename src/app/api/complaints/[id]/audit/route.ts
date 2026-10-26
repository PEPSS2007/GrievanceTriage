import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../../lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDatabase();

    const logs = await db.getAuditLogs(100, id);

    return NextResponse.json({
      success: true,
      complaint_id: id,
      count: logs.length,
      logs,
      demo_persistence_notice:
        'Audit history is pulled directly from the persistent database adapter (Supabase Postgres or in-memory prototype store).',
    });
  } catch (error: any) {
    console.error('GET /api/complaints/[id]/audit error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to retrieve complaint audit history' },
      { status: 500 }
    );
  }
}
