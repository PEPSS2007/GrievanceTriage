import { describe, it } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST as postResolutionHandler, PATCH as patchResolutionHandler } from "../src/app/api/resolution/route";
import { POST as registerHandler } from "../src/app/api/complaints/route";
import { getDatabase } from "../src/lib/db";

describe("Resolution Verification Workflow End-to-End", () => {
  it("transitions complaint to 'Verification Pending' upon department resolution submission", async () => {
    const db = getDatabase();

    // 1. Register a test complaint
    const regReq = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: JSON.stringify({
        text: `Active water pipe burst spraying on sidewalk [${Date.now()}]`,
        location: "12 Elm Street, Ward 3",
        ward: "Ward 3",
        source: "Phone",
        category: "Water Supply & Sewage"
      })
    });
    const regRes = await registerHandler(regReq);
    assert.strictEqual(regRes.status, 201);
    const { complaint } = await regRes.json();

    // 2. Department submits resolution
    const submitReq = new NextRequest("http://localhost:3000/api/resolution", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: complaint.id,
        officer_name: "Eng. Anita Roy",
        department_id: "dept_water",
        action_taken: "Replaced damaged gasket and restored 4-inch pressurized mains.",
        work_order_ref: "WO-WATER-9921",
        after_photo_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400",
        after_photo_name: "after_repair_valve.jpg"
      })
    });

    const submitRes = await postResolutionHandler(submitReq);
    assert.strictEqual(submitRes.status, 200);
    const submitJson = await submitRes.json();

    assert.strictEqual(submitJson.success, true);
    assert.strictEqual(submitJson.decision.status, "Verification Pending");
    assert.ok(submitJson.evidence);
    assert.strictEqual(submitJson.evidence.work_order_ref, "WO-WATER-9921");

    // Verify DB reflects Verification Pending
    const dbDecision = await db.getDecisionByComplaintId(complaint.id);
    assert.strictEqual(dbDecision?.status, "Verification Pending");
  });

  it("allows authorized reviewer to approve resolution as 'Verified Resolved' with audit trail", async () => {
    const db = getDatabase();

    // 1. Create a fresh complaint and move it to Verification Pending
    const regReq = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: JSON.stringify({
        text: `Open pothole causing tire damage near market gate [${Date.now()}]`,
        location: "Market Square, Ward 1",
        ward: "Ward 1",
        source: "In Person"
      })
    });
    const regRes = await registerHandler(regReq);
    const { complaint } = await regRes.json();

    await postResolutionHandler(new NextRequest("http://localhost:3000/api/resolution", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: complaint.id,
        officer_name: "Eng. Vikram Sethi",
        department_id: "dept_roads",
        action_taken: "Pothole filled with hot asphalt and steam-roller compacted.",
        work_order_ref: "WO-ROAD-4011",
        after_photo_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400"
      })
    }));

    // 2. Reviewer inspects evidence and approves
    const verifyReq = new NextRequest("http://localhost:3000/api/resolution", {
      method: "PATCH",
      body: JSON.stringify({
        complaint_id: complaint.id,
        action: "VERIFY_RESOLVED",
        reviewer: "Municipal Inspector R. Vance",
        note: "Inspected site on-site; road surface completely restored and level."
      })
    });

    const verifyRes = await patchResolutionHandler(verifyReq);
    assert.strictEqual(verifyRes.status, 200);
    const verifyJson = await verifyRes.json();

    assert.strictEqual(verifyJson.success, true);
    assert.strictEqual(verifyJson.new_status, "Verified Resolved");

    // Verify Audit Event recorded
    const audits = await db.getAuditLogs(complaint.id);
    const verifiedAudit = audits.find(a => a.action === "RESOLUTION_VERIFIED_RESOLVED");
    assert.ok(verifiedAudit);
    assert.strictEqual(verifiedAudit.actor, "Municipal Inspector R. Vance");
  });

  it("enforces evidence requirement or documented policy exception during reviewer verification", async () => {
    // Put CMP-002 into Verification Pending stage
    await postResolutionHandler(new NextRequest("http://localhost:3000/api/resolution", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: "CMP-002",
        officer_name: "Eng. Anita Roy",
        department_id: "dept_water",
        action_taken: "Emergency line repair performed without photo capture."
      })
    }));

    // Verification with documented policy exception succeeds
    const patchReq = new NextRequest("http://localhost:3000/api/resolution", {
      method: "PATCH",
      body: JSON.stringify({
        complaint_id: "CMP-002",
        action: "VERIFY_RESOLVED",
        reviewer: "Municipal Inspector R. Vance",
        allow_exception: true,
        exception_reason: "Emergency verbal confirmation from Ward Councillor"
      })
    });

    const patchRes = await patchResolutionHandler(patchReq);
    assert.strictEqual(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.strictEqual(patchJson.success, true);
  });

  it("allows reviewer to reject resolution and sets status to 'Rejected — Further Action Required'", async () => {
    const db = getDatabase();

    // 1. Create a fresh complaint and move to Verification Pending
    const regReq = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: JSON.stringify({
        text: `Streetlight fixture hanging loosely by wires [${Date.now()}]`,
        location: "Park Avenue, Ward 2",
        ward: "Ward 2",
        source: "Email"
      })
    });
    const regRes = await registerHandler(regReq);
    const { complaint } = await regRes.json();

    await postResolutionHandler(new NextRequest("http://localhost:3000/api/resolution", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: complaint.id,
        officer_name: "Electrician Dave",
        department_id: "dept_electricity",
        action_taken: "Secured wire connection with tape."
      })
    }));

    // 2. Reviewer rejects because repair is incomplete
    const rejectReq = new NextRequest("http://localhost:3000/api/resolution", {
      method: "PATCH",
      body: JSON.stringify({
        complaint_id: complaint.id,
        action: "REJECT_RESOLUTION",
        reviewer: "Senior Safety Inspector K. Rao",
        rejection_reason: "Electrical hazard persists. Fixture mount bracket is cracked and needs full structural replacement."
      })
    });

    const rejectRes = await patchResolutionHandler(rejectReq);
    assert.strictEqual(rejectRes.status, 200);
    const rejectJson = await rejectRes.json();

    assert.strictEqual(rejectJson.success, true);
    assert.strictEqual(rejectJson.new_status, "Rejected — Further Action Required");

    // Verify DB status
    const dbDecision = await db.getDecisionByComplaintId(complaint.id);
    assert.strictEqual(dbDecision?.status, "Rejected — Further Action Required");
  });

  it("allows authorized reopening with mandatory reason while preserving prior resolution records", async () => {
    const db = getDatabase();

    // 1. Create complaint, resolve it
    const regReq = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: JSON.stringify({
        text: `Garbage bin overflowing onto road [${Date.now()}]`,
        location: "15 Green View Road, Ward 5",
        ward: "Ward 5",
        source: "Phone"
      })
    });
    const regRes = await registerHandler(regReq);
    const { complaint } = await regRes.json();

    await postResolutionHandler(new NextRequest("http://localhost:3000/api/resolution", {
      method: "POST",
      body: JSON.stringify({
        complaint_id: complaint.id,
        officer_name: "Sanitation Supervisor Mark",
        department_id: "dept_sanitation",
        action_taken: "Waste cleared and bin sanitized."
      })
    }));

    await patchResolutionHandler(new NextRequest("http://localhost:3000/api/resolution", {
      method: "PATCH",
      body: JSON.stringify({
        complaint_id: complaint.id,
        action: "VERIFY_RESOLVED",
        reviewer: "Inspector Vance"
      })
    }));

    // 2. Reopen complaint with mandatory grounds
    const reopenReq = new NextRequest("http://localhost:3000/api/resolution", {
      method: "PATCH",
      body: JSON.stringify({
        complaint_id: complaint.id,
        action: "REOPEN",
        reviewer: "Officer Sarah (Municipal Admin)",
        dispute_reason: "Citizen visited ward office: adjacent commercial dumpsters not cleared; foul odor persists."
      })
    });

    const reopenRes = await patchResolutionHandler(reopenReq);
    assert.strictEqual(reopenRes.status, 200);
    const reopenJson = await reopenRes.json();

    assert.strictEqual(reopenJson.success, true);
    assert.strictEqual(reopenJson.new_status, "Reopened");

    // Prior audit history must be preserved
    const audits = await db.getAuditLogs(complaint.id);
    assert.ok(audits.some(a => a.action === "RESOLUTION_VERIFIED_RESOLVED" || a.action === "RESOLUTION_SUBMITTED_BY_DEPARTMENT"));
    assert.ok(audits.some(a => a.action === "RESOLUTION_REOPENED"));
  });
});
