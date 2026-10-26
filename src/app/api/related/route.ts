import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../lib/db";
import { TFIDFIndex } from "../../../core/similarity";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const complaintId = searchParams.get("complaint_id");

    if (!complaintId) {
      return NextResponse.json(
        { success: false, message: "Missing required query parameter 'complaint_id'" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const target = await db.getComplaintById(complaintId);
    if (!target) {
      return NextResponse.json(
        { success: false, message: `Complaint ${complaintId} not found` },
        { status: 404 }
      );
    }

    const allComplaints = await db.getComplaints();
    const analyses = await db.getAnalyses();

    const categoryMap = new Map<string, string>();
    for (const a of analyses) {
      categoryMap.set(a.complaint_id, a.category);
    }

    const index = new TFIDFIndex();
    for (const c of allComplaints) {
      index.addDocument(c.id, c.text);
    }

    const targetCategory = categoryMap.get(complaintId);
    const candidates = index.findRelated(target, allComplaints, targetCategory, categoryMap);

    return NextResponse.json({
      success: true,
      complaint_id: target.id,
      location: target.location,
      total_candidates: candidates.length,
      candidates,
    });
  } catch (error: any) {
    console.error("GET /api/related error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
