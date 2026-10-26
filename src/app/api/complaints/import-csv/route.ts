import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "../../../../lib/db";
import { triageComplaint } from "../../../../core/triage";

const CsvRowSchema = z.object({
  text: z.string().min(5, "Complaint description must be at least 5 characters"),
  location: z.string().min(2, "Location is required"),
  ward: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  source_reference: z.string().optional(),
  reporting_person: z
    .object({
      name: z.string().optional(),
      contact: z.string().optional(),
    })
    .optional(),
});

const CsvBatchImportSchema = z.object({
  rows: z.array(z.record(z.any())).min(1, "At least one row required for import"),
  importing_officer: z.string().optional().default("Officer Sarah (Municipal Admin)"),
  batch_identifier: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CsvBatchImportSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV Import validation failed",
          errors: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { rows, importing_officer, batch_identifier } = validated.data;
    const batchId = batch_identifier || `CSV-BATCH-${Date.now()}`;
    const db = getDatabase();

    const existingComplaints = await db.getComplaints();
    const existingTexts = new Set(existingComplaints.map((c) => c.text.trim().toLowerCase()));
    const existingRefs = new Set(
      existingComplaints.map((c) => (c as any).source_reference).filter(Boolean)
    );
    const seenBatchRefs = new Set<string>();
    const seenBatchTexts = new Set<string>();

    let importedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const errors: Array<{ row_index: number; reason: string }> = [];
    const importedComplaints: any[] = [];
    const analysesMap: Record<string, any> = {};

    // Safe sequential / bounded concurrency triage
    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const rowValidation = CsvRowSchema.safeParse(rawRow);

      if (!rowValidation.success) {
        failedCount++;
        const issues = Object.values(rowValidation.error.flatten().fieldErrors).flat();
        errors.push({
          row_index: i + 1,
          reason: issues.join(", ") || "Row validation failed",
        });
        continue;
      }

      const row = rowValidation.data;
      const normalizedText = row.text.trim().toLowerCase();

      // Check duplicates against database and within the batch
      const isDuplicateRef =
        row.source_reference &&
        (existingRefs.has(row.source_reference) || seenBatchRefs.has(row.source_reference));
      const isDuplicateText =
        existingTexts.has(normalizedText) || seenBatchTexts.has(normalizedText);

      if (isDuplicateRef || isDuplicateText) {
        duplicateCount++;
        continue;
      }

      if (row.source_reference) {
        seenBatchRefs.add(row.source_reference);
      }
      seenBatchTexts.add(normalizedText);

      try {
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const newId = `CMP-${year}-${randomSuffix}`;

        const triageResult = await triageComplaint({
          complaintId: newId,
          text: row.text,
          location: row.location,
          ward: row.ward,
          source: "Other",
          source_reference: row.source_reference || `CSV-ROW-${i + 1}`,
          receiving_officer: importing_officer,
          is_demo: false,
          created_at: new Date().toISOString(),
          reporting_person: row.reporting_person,
        });

        if (row.category && row.category !== "ALL") {
          triageResult.analysis.category = row.category;
          await db.saveAnalysis(triageResult.analysis);
        }

        importedCount++;
        const finalComplaint = {
          ...triageResult.complaint,
          shortId: newId,
          is_demo: false,
          source: "Other",
        };
        importedComplaints.push(finalComplaint);
        analysesMap[newId] = triageResult.analysis;
      } catch (err: any) {
        failedCount++;
        errors.push({
          row_index: i + 1,
          reason: err?.message || "Failed to triage and store record",
        });
      }
    }

    // Record genuine batch audit log
    await db.logAudit({
      entity_name: "complaint",
      entity_id: batchId,
      action: "CSV_IMPORT_COMPLETED",
      before_state: null,
      after_state: {
        batch_id: batchId,
        total_rows: rows.length,
        imported_count: importedCount,
        duplicate_count: duplicateCount,
        failed_count: failedCount,
        importing_officer,
      },
      reviewer: importing_officer,
      actor: importing_officer,
    });

    return NextResponse.json(
      {
        success: true,
        batch_id: batchId,
        summary: {
          imported: importedCount,
          duplicates: duplicateCount,
          failed: failedCount,
        },
        errors,
        complaints: importedComplaints,
        analyses: analysesMap,
        message: `CSV import completed: ${importedCount} imported, ${duplicateCount} duplicates skipped, ${failedCount} failed.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/complaints/import-csv error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "CSV batch import failed" },
      { status: 500 }
    );
  }
}
