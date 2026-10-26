import { describe, it } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST as importCsvHandler } from "../src/app/api/complaints/import-csv/route";
import { getDatabase } from "../src/lib/db";

describe("CSV Complaint Import End-to-End", () => {
  it("imports valid CSV rows, performs bounded concurrency AI triage, and returns summary", async () => {
    const timestamp = Date.now();
    const rows = [
      {
        text: `Severe water pipe leakage near Metro Pillar 14 [${timestamp}]`,
        location: "Outer Ring Road, Ward 2",
        ward: "Ward 2",
        category: "Water Supply & Sewage",
        source_reference: `CSV-BATCH-${timestamp}-01`
      },
      {
        text: `Overhead power cable sparking near residential complex [${timestamp}]`,
        location: "Palm Avenue, Ward 4",
        ward: "Ward 4",
        category: "Electrical Hazards",
        priority: "Critical" as const,
        source_reference: `CSV-BATCH-${timestamp}-02`
      },
      {
        text: `Uncollected residential garbage pile blocking lane [${timestamp}]`,
        location: "12th Cross, Ward 1",
        ward: "Ward 1",
        category: "Garbage & Sanitation",
        source_reference: `CSV-BATCH-${timestamp}-03`
      }
    ];

    const req = new NextRequest("http://localhost:3000/api/complaints/import-csv", {
      method: "POST",
      body: JSON.stringify({
        rows,
        importing_officer: "Officer Sarah (Municipal Admin)"
      })
    });

    const res = await importCsvHandler(req);
    assert.strictEqual(res.status, 201);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.strictEqual(json.summary.imported, 3);
    assert.strictEqual(json.summary.duplicates, 0);
    assert.strictEqual(json.summary.failed, 0);
    assert.strictEqual(json.complaints.length, 3);

    // Verify AI analysis was generated for each imported complaint
    for (const c of json.complaints) {
      assert.ok(json.analyses[c.id]);
      assert.strictEqual(json.analyses[c.id].complaint_id, c.id);
      assert.strictEqual(c.is_demo, false);
      assert.strictEqual(c.source, "Other");
    }

    // Verify batch audit trail
    const db = getDatabase();
    const audits = await db.getAuditLogs(json.batch_id);
    assert.ok(audits.length > 0);
    assert.strictEqual(audits[0].action, "CSV_IMPORT_COMPLETED");
  });

  it("identifies invalid rows, flags errors, and skips duplicate source references", async () => {
    const timestamp = Date.now();
    const existingRef = `STABLE-REF-${timestamp}`;

    // First import to establish the existingRef
    await importCsvHandler(new NextRequest("http://localhost:3000/api/complaints/import-csv", {
      method: "POST",
      body: JSON.stringify({
        rows: [
          {
            text: `Initial complaint with external reference [${timestamp}]`,
            location: "Main Street, Ward 1",
            source_reference: existingRef
          }
        ],
        importing_officer: "Officer Sarah"
      })
    }));

    // Second import containing:
    // 1. Duplicate of existingRef
    // 2. Duplicate within the same batch (duplicate batch ref)
    // 3. Invalid row (text too short)
    // 4. Invalid row (missing location)
    // 5. One valid unique row
    const mixedRows = [
      {
        text: `Duplicate complaint with already existing external reference [${timestamp}]`,
        location: "Main Street, Ward 1",
        source_reference: existingRef // Already in DB
      },
      {
        text: `First instance of batch duplicate [${timestamp}]`,
        location: "Second Cross, Ward 3",
        source_reference: `IN-BATCH-DUP-${timestamp}`
      },
      {
        text: `Second instance of batch duplicate [${timestamp}]`,
        location: "Second Cross, Ward 3",
        source_reference: `IN-BATCH-DUP-${timestamp}` // Duplicate within batch
      },
      {
        text: "Hi", // Invalid: text too short (< 5 chars)
        location: "Ward 4"
      },
      {
        text: "Valid complaint description without location specified",
        location: "" // Invalid: location missing
      },
      {
        text: `Valid unique complaint that should be imported successfully [${timestamp}]`,
        location: "77 Park Street, Ward 2",
        source_reference: `UNIQUE-ROW-${timestamp}`
      }
    ];

    const req = new NextRequest("http://localhost:3000/api/complaints/import-csv", {
      method: "POST",
      body: JSON.stringify({
        rows: mixedRows,
        importing_officer: "Officer Sarah"
      })
    });

    const res = await importCsvHandler(req);
    assert.strictEqual(res.status, 201);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    // 2 rows successfully imported (first instance of in-batch + unique row)
    assert.strictEqual(json.summary.imported, 2);
    // 2 duplicates skipped (existingRef + second instance of in-batch)
    assert.strictEqual(json.summary.duplicates, 2);
    // 2 invalid rows failed
    assert.strictEqual(json.summary.failed, 2);
    assert.strictEqual(json.errors.length, 2);
  });
});
