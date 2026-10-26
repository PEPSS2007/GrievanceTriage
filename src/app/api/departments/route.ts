import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/db";

export async function GET() {
  try {
    const db = getDatabase();
    const departments = await db.getDepartments();

    return NextResponse.json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error: any) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
