import { describe, it } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST as registerHandler, GET as listHandler } from "../src/app/api/complaints/route";
import { getDatabase } from "../src/lib/db";

describe("Officer Complaint Registration End-to-End", () => {
  it("registers a complaint received by Phone, generates a unique ID, runs AI triage, and marks is_demo false", async () => {
    const db = getDatabase();
    const uniqueText = `Urgent: Sewage line collapsed on 8th Cross Road causing massive street backflow [${Date.now()}]`;
    const req = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: JSON.stringify({
        text: uniqueText,
        location: "8th Cross Road, Ward 4, Metroville",
        ward: "Ward 4",
        source: "Phone",
        category: "Water Supply & Sewage",
        receiving_officer: "Officer Sarah (Municipal Admin)",
        source_reference: `CALL-REF-${Date.now().toString().slice(-4)}`,
        officer_notes: "Citizen called municipal 24x7 control helpline; urgent backflow reported."
      })
    });

    const res = await registerHandler(req);
    assert.strictEqual(res.status, 201);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.ok(json.complaint);
    assert.ok(json.complaint.id.startsWith("CMP-"));
    assert.strictEqual(json.complaint.source, "Phone");
    assert.strictEqual(json.complaint.is_demo, false);
    assert.strictEqual(json.complaint.receiving_officer, "Officer Sarah (Municipal Admin)");

    // AI Analysis verification
    assert.ok(json.analysis);
    assert.strictEqual(json.analysis.complaint_id, json.complaint.id);
    assert.ok(json.analysis.summary.length > 0);
    assert.ok(json.analysis.priority_evidence.length > 0);

    // Verify DB persistence
    const saved = await db.getComplaintById(json.complaint.id);
    assert.ok(saved);
    assert.strictEqual(saved.is_demo, false);

    // Verify Audit Trail
    const audits = await db.getAuditLogs(json.complaint.id);
    assert.ok(audits.length > 0);
    const intakeAudit = audits.find(a => a.action === "MANUAL_COMPLAINT_REGISTERED" || a.entity_name === "complaint");
    assert.ok(intakeAudit);
    assert.strictEqual(intakeAudit.actor, "Officer Sarah (Municipal Admin)");
  });

  it("registers a complaint received by Email or In Person with optional reporting person details", async () => {
    const emailReq = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: JSON.stringify({
        text: `Broken traffic light pole leaning dangerously over sidewalk [${Date.now()}]`,
        location: "Koramangala 5th Block, Ward 2",
        ward: "Ward 2",
        source: "Email",
        reporting_person: {
          name: "Suresh Menon",
          contact: "+91-9845012345"
        },
        source_reference: `EMAIL-TICKET-${Date.now().toString().slice(-4)}`
      })
    });

    const emailRes = await registerHandler(emailReq);
    assert.strictEqual(emailRes.status, 201);
    const emailJson = await emailRes.json();
    assert.strictEqual(emailJson.complaint.source, "Email");
    assert.strictEqual(emailJson.complaint.reporting_person.name, "Suresh Menon");

    const inPersonReq = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: JSON.stringify({
        text: `Open construction trench uncovered near public park playground [${Date.now()}]`,
        location: "Sector 3 Public Park, Ward 5",
        ward: "Ward 5",
        source: "In Person",
        receiving_officer: "Field Officer John Doe",
        officer_notes: "Walk-in resident reported hazard directly at ward office."
      })
    });

    const inPersonRes = await registerHandler(inPersonReq);
    assert.strictEqual(inPersonRes.status, 201);
    const inPersonJson = await inPersonRes.json();
    assert.strictEqual(inPersonJson.complaint.source, "In Person");
    assert.strictEqual(inPersonJson.complaint.receiving_officer, "Field Officer John Doe");
  });

  it("prevents duplicate submissions caused by double-clicking or rapid network retries", async () => {
    const timestamp = Date.now();
    const duplicatePayload = {
      text: `Duplicate check: fallen tree branch blocking alleyway [${timestamp}]`,
      location: `Alley 7, Ward 1, Metroville [${timestamp}]`,
      source: "Phone",
      receiving_officer: "Officer Sarah"
    };

    const firstReq = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: JSON.stringify(duplicatePayload)
    });
    const firstRes = await registerHandler(firstReq);
    assert.strictEqual(firstRes.status, 201);

    // Immediate retry with identical text & location
    const retryReq = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: JSON.stringify(duplicatePayload)
    });
    const retryRes = await registerHandler(retryReq);
    assert.strictEqual(retryRes.status, 409);
    const retryJson = await retryRes.json();
    assert.strictEqual(retryJson.duplicate, true);
  });

  it("filters complaints by channel and preserves non-demo status in GET /api/complaints", async () => {
    const listReq = new NextRequest("http://localhost:3000/api/complaints?channel=Phone");
    const listRes = await listHandler(listReq);
    assert.strictEqual(listRes.status, 200);
    const listJson = await listRes.json();

    assert.ok(listJson.complaints);
    assert.ok(listJson.complaints.length > 0);
    // Every returned complaint must match the Phone source
    for (const c of listJson.complaints) {
      assert.strictEqual(c.source, "Phone");
    }
  });
});
