import { describe, it } from "node:test";
import assert from "node:assert";
import {
  ComplaintSchema,
  AnalysisSchema,
  DepartmentSchema,
  ReviewDecisionSchema,
  IncidentGroupSchema,
  HandoffSchema,
  EscalationSchema,
} from "../src/contracts";

describe("Shared TypeScript & Zod Schemas", () => {
  it("validates a compliant Department schema", () => {
    const validDept = {
      id: "dept_roads",
      name: "Roads Department",
      categories: ["Roads & Footpaths"],
      email: "roads@metroville.gov.synthetic",
      phone: "+1-555-0101",
      escalation_contact: "Chief Engineer",
      is_demo: true,
    };
    const res = DepartmentSchema.safeParse(validDept);
    assert.strictEqual(res.success, true);
  });

  it("fails a Department schema missing required email", () => {
    const invalidDept = {
      id: "dept_roads",
      name: "Roads Department",
      categories: ["Roads"],
      phone: "+1-555-0101",
    };
    const res = DepartmentSchema.safeParse(invalidDept);
    assert.strictEqual(res.success, false);
  });

  it("validates Complaint schema", () => {
    const complaint = {
      id: "CMP-101",
      text: "Exposed wire on sidewalk",
      location: "Ward 1",
      source: "Web Portal",
    };
    const res = ComplaintSchema.safeParse(complaint);
    assert.strictEqual(res.success, true);
  });

  it("validates Analysis schema with priority evidence", () => {
    const analysis = {
      complaint_id: "CMP-101",
      summary: "Sparking live electrical wire outside school",
      category: "Street Lighting & Electricity",
      priority: "Urgent",
      priority_evidence: [
        { rule_name: "High Voltage Safety Hazard", matched_phrase: "sparking", weight: 10 },
      ],
      recommended_department_id: "dept_electricity",
      suggested_action: "Dispatch emergency electrical van",
      uncertainties: [],
      needs_human_review: true,
      redacted_pii_count: 0,
      suspicious_text_detected: false,
      method: "ai",
      confidence: 0.95,
    };
    const res = AnalysisSchema.safeParse(analysis);
    assert.strictEqual(res.success, true);
  });

  it("validates ReviewDecision schema", () => {
    const decision = {
      complaint_id: "CMP-101",
      approved_category: "Street Lighting & Electricity",
      approved_priority: "Urgent",
      approved_department_id: "dept_electricity",
      status: "Approved",
      reviewer_note: "Immediate action required",
    };
    const res = ReviewDecisionSchema.safeParse(decision);
    assert.strictEqual(res.success, true);
  });

  it("validates IncidentGroup schema", () => {
    const group = {
      id: "GRP-WATER-01",
      title: "Water Main Burst on Pine St",
      category: "Water Supply & Sewage",
    };
    const res = IncidentGroupSchema.safeParse(group);
    assert.strictEqual(res.success, true);
  });

  it("validates Handoff and Escalation schemas", () => {
    const handoff = {
      id: "HND-01",
      complaint_id: "CMP-101",
      department_id: "dept_electricity",
      channel: "email",
      message_draft: "Please dispatch technician",
      status: "Prepared",
    };
    const res1 = HandoffSchema.safeParse(handoff);
    assert.strictEqual(res1.success, true);

    const escalation = {
      complaint_id: "CMP-101",
      level: 2,
      reason: "No response after SLA expiration",
      follow_up_date: "2026-10-28",
    };
    const res2 = EscalationSchema.safeParse(escalation);
    assert.strictEqual(res2.success, true);
  });
});
