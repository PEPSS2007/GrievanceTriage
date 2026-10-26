import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { triageComplaint } from "../../../core/triage";

const AnalyzeRequestSchema = z.object({
  complaint_id: z.string().optional(),
  text: z.string().min(3, "Complaint text must have at least 3 characters"),
  location: z.string().min(1, "Location is required"),
  source: z.string().optional().default("Web Portal"),
  forceFallback: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = AnalyzeRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { text, location, source, forceFallback } = validated.data;
    const complaintId = validated.data.complaint_id || `CMP-${Date.now()}`;

    const result = await triageComplaint({
      complaintId,
      text,
      location,
      source,
      forceFallback,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("POST /api/analyze error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
