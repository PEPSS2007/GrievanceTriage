import { describe, it } from "node:test";
import assert from "node:assert";
import { validateStatusTransition } from "../src/core/state-machine";

describe("7-Status Lifecycle State Machine", () => {
  it("allows valid forward transition: Pending Review -> Approved", () => {
    const res = validateStatusTransition("Pending Review", "Approved");
    assert.strictEqual(res.allowed, true);
  });

  it("allows valid forward transition: Approved -> Contact Initiated", () => {
    const res = validateStatusTransition("Approved", "Contact Initiated");
    assert.strictEqual(res.allowed, true);
  });

  it("allows valid escalation from Contact Initiated", () => {
    const res = validateStatusTransition("Contact Initiated", "Escalated");
    assert.strictEqual(res.allowed, true);
  });

  it("allows valid escalation from Acknowledged", () => {
    const res = validateStatusTransition("Acknowledged", "Escalated");
    assert.strictEqual(res.allowed, true);
  });

  it("allows Needs More Information transition from Pending Review", () => {
    const res = validateStatusTransition("Pending Review", "Needs More Information");
    assert.strictEqual(res.allowed, true);
  });

  it("rejects illegal skip transition: Pending Review -> Resolved directly", () => {
    const res = validateStatusTransition("Pending Review", "Resolved");
    assert.strictEqual(res.allowed, false);
    assert.ok(res.message?.includes("Invalid state transition"));
  });

  it("rejects illegal transition: Resolved -> Contact Prepared", () => {
    const res = validateStatusTransition("Resolved", "Contact Prepared");
    assert.strictEqual(res.allowed, false);
  });
});
