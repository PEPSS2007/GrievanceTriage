import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/db";

export async function POST() {
  try {
    const db = getDatabase();
    await db.resetToDemo();

    return NextResponse.json({
      success: true,
      message: "Database restored to demo baseline with 60 complaints and precomputed analyses.",
    });
  } catch (error: any) {
    console.error("POST /api/reset-demo error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
