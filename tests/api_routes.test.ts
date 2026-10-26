import { describe, it, before } from "node:test";
import assert from "node:assert";
import { POST as analyzeHandler } from "../src/app/api/analyze/route";
import { GET as complaintsHandler } from "../src/app/api/complaints/route";
import { POST as reviewHandler } from "../src/app/api/review/route";
import { GET as relatedHandler } from "../src/app/api/related/route";
import { POST as handoffHandler } from "../src/app/api/handoff/route";
import { POST as escalateHandler } from "../src/app/api/escalate/route";
import { GET as departmentsHandler } from "../src/app/api/departments/route";
import { POST as resetDemoHandler } from "../src/app/api/reset-demo/route";
import { GET as getAuditHandler, POST as postAuditHandler } from "../src/app/api/audit/route";
import { POST as visionHandler } from "../src/app/api/analyze/vision/route";
import { POST as postResolutionHandler, PATCH as patchResolutionHandler } from "../src/app/api/resolution/route";
import { POST as webhookIntakeHandler } from "../src/app/api/intake/webhook/route";
import { getDatabase } from "../src/lib/db";
import { NextRequest } from "next/server";

describe("API Route Handlers End-to-End", () => {
  before(async () => {
    const db = getDatabase();
    await db.resetToDemo();
  });

  it("GET /api/departments returns all 6 synthetic departments", async () => {
    const res = await departmentsHandler();
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.strictEqual(json.count, 6);
    assert.strictEqual(json.departments.length, 6);
    assert.ok(json.departments.some((d: any) => d.id === "dept_roads"));
  });

  it("POST /api/reset-demo restores 60 seeded complaints in in-memory demo mode", async () => {
    const res = await resetDemoHandler();
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.ok(json.message.includes("demo baseline"));

    const db = getDatabase();
    const complaints = await db.getComplaints();
    assert.strictEqual(complaints.length, 60);
  });

  it("POST /api/analyze triages a new complaint and returns structured analysis", async () => {
    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: "CMP-API-TEST-1",
        text: "Dangerous exposed wire sparking on Elm Street near school gate.",
        location: "Ward 1, Elm Street",
      }),
    });

    const res = await analyzeHandler(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.strictEqual(json.complaint.id, "CMP-API-TEST-1");
    assert.strictEqual(json.analysis.priority, "Urgent");
    assert.strictEqual(json.analysis.category, "Street Lighting & Electricity");
    assert.strictEqual(json.analysis.recommended_department_id, "dept_electricity");
  });

  it("GET /api/complaints returns seed complaints with filters", async () => {
    const req = new NextRequest("http://localhost:3000/api/complaints?limit=10");
    const res = await complaintsHandler(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.ok(json.count >= 60);
    assert.ok(Array.isArray(json.complaints));
  });

  it("POST /api/review records reviewer approval with audit trail", async () => {
    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: "CMP-001",
        approved_category: "Water Supply & Sewage",
        approved_priority: "Urgent",
        approved_department_id: "dept_water",
        status: "Approved",
        reviewer_note: "Confirmed water main rupture",
      }),
    });

    const res = await reviewHandler(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.strictEqual(json.decision.status, "Approved");
    assert.strictEqual(json.decision.approved_priority, "Urgent");
  });

  it("GET /api/related identifies incident candidate pairs", async () => {
    const req = new NextRequest("http://localhost:3000/api/related?complaint_id=CMP-001");
    const res = await relatedHandler(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.strictEqual(json.complaint_id, "CMP-001");
    assert.ok(json.candidates.length > 0);
  });

  it("POST /api/handoff initiates department contact and logs status", async () => {
    const req = new NextRequest("http://localhost:3000/api/handoff", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: "CMP-001",
        department_id: "dept_water",
        channel: "email",
        message_draft: "Please dispatch maintenance unit for Pine Street water burst.",
        status: "Initiated",
      }),
    });

    const res = await handoffHandler(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.strictEqual(json.handoff.status, "Initiated");
    assert.strictEqual(json.decision.status, "Contact Initiated");
  });

  it("POST /api/escalate enforces valid escalation lifecycle", async () => {
    const req = new NextRequest("http://localhost:3000/api/escalate", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: "CMP-001",
        level: 2,
        reason: "No acknowledgment received within 24 hours SLA",
        follow_up_date: "2026-10-27",
      }),
    });

    const res = await escalateHandler(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.strictEqual(json.escalation.level, 2);
    assert.strictEqual(json.decision.status, "Escalated");
  });

  it("POST & GET /api/audit records and retrieves genuine audit events", async () => {
    const postReq = new NextRequest("http://localhost:3000/api/audit", {
      method: "POST",
      body: JSON.stringify({
        entity_name: "complaint_review",
        entity_id: "CMP-001",
        action: "OFFICER_OVERRIDE",
        before_state: { priority: "Medium" },
        after_state: { priority: "High" },
        reviewer: "Officer Smith",
        reviewer_note: "Upgraded priority due to pedestrian volume",
        override_reason: "High foot traffic corridor",
      }),
    });

    const postRes = await postAuditHandler(postReq);
    assert.strictEqual(postRes.status, 200);

    const getReq = new NextRequest("http://localhost:3000/api/audit?complaint_id=CMP-001");
    const getRes = await getAuditHandler(getReq);
    assert.strictEqual(getRes.status, 200);
    const getJson = await getRes.json();
    assert.strictEqual(getJson.success, true);
    assert.ok(getJson.count >= 1);
    assert.ok(getJson.logs.some((l: any) => l.entity_id === "CMP-001"));
  });

  it("POST /api/analyze/vision returns structured observations and disclaimers", async () => {
    const req = new NextRequest("http://localhost:3000/api/analyze/vision", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: "CMP-001",
        image_url: "https://example.com/burst_pipe.jpg",
        complaint_text: "Water burst outside residential home flooding asphalt driveway",
        category: "Water Supply & Sewage",
        location: "Ward 4",
      }),
    });

    const res = await visionHandler(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.ok(json.analysis.visible_observations.length > 0);
    assert.ok(json.analysis.uncertainty_note.length > 0);
    assert.ok(json.analysis.confidence >= 0.75);
  });

  it("POST & PATCH /api/resolution enforces department evidence submission and verification", async () => {
    const postReq = new NextRequest("http://localhost:3000/api/resolution", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: "CMP-001",
        officer_name: "Eng. Vikram Sethi",
        department_id: "dept_water",
        action_taken: "Replaced 4-inch ductile iron valve assembly and restored asphalt paving.",
      }),
    });

    const postRes = await postResolutionHandler(postReq);
    assert.strictEqual(postRes.status, 200);
    const postJson = await postRes.json();
    assert.strictEqual(postJson.success, true);
    assert.ok(
      postJson.decision.status === "Verification Pending" || postJson.decision.status === "Resolution Submitted",
      `Expected Verification Pending or Resolution Submitted, got ${postJson.decision.status}`
    );

    const patchReq = new NextRequest("http://localhost:3000/api/resolution", {
      method: "PATCH",
      body: JSON.stringify({
        complaint_id: "CMP-001",
        action: "VERIFY_RESOLVED",
        reviewer: "Municipal Inspector R. Vance",
      }),
    });

    const patchRes = await patchResolutionHandler(patchReq);
    assert.strictEqual(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.strictEqual(patchJson.success, true);
    assert.ok(
      patchJson.new_status === "Verified Resolved" || patchJson.new_status === "Resolved",
      `Expected Verified Resolved or Resolved, got ${patchJson.new_status}`
    );
  });

  it("POST /api/intake/webhook ingests grievance and returns 201 Created with triage analysis", async () => {
    const req = new NextRequest("http://localhost:3000/api/intake/webhook", {
      method: "POST",
      headers: {
        Authorization: "Bearer demo_webhook_key",
      },
      body: JSON.stringify({
        external_source: "CPGRAMS National Portal",
        external_reference_id: `CPGRAMS-TEST-${Date.now()}`,
        text: "Dangerous street pothole near intersection causing severe tire hazard",
        location: "Ward 3, Main Crossing",
        category_hint: "Roads & Footpaths",
      }),
    });

    const res = await webhookIntakeHandler(req);
    assert.strictEqual(res.status, 201);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.strictEqual(json.complaint.source, "Integration API");
    assert.ok(json.triage_analysis.summary.length > 0);
  });
});
