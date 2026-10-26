import { describe, it } from "node:test";
import assert from "node:assert";
import { evaluatePriorityRules } from "../src/core/rules";

describe("Deterministic Priority Rules", () => {
  it("flags exposed live wire as Urgent safety priority", () => {
    const text = "Sparking live wire hanging down near the bus stop.";
    const evalResult = evaluatePriorityRules(text);

    assert.strictEqual(evalResult.forcedPriority, "Urgent");
    assert.ok(evalResult.evidence.some((e) => e.rule_name === "High Voltage Safety Hazard"));
  });

  it("flags open manhole cover as Urgent priority", () => {
    const text = "Missing manhole cover on dark road corner, danger of falling.";
    const evalResult = evaluatePriorityRules(text);

    assert.strictEqual(evalResult.forcedPriority, "Urgent");
    assert.ok(evalResult.evidence.some((e) => e.rule_name === "Open Manhole / Pedestrian Trap"));
  });

  it("boosts priority to High when near a school entrance", () => {
    const text = "Broken pavement crater directly outside the school gate.";
    const evalResult = evaluatePriorityRules(text);

    assert.strictEqual(evalResult.forcedPriority, "High");
    assert.ok(evalResult.evidence.some((e) => e.rule_name === "Sensitive Public Facility Proximity"));
  });

  it("returns null forced priority for routine non-hazardous text", () => {
    const text = "A park bench has faded paint on 3rd Avenue.";
    const evalResult = evaluatePriorityRules(text);

    assert.strictEqual(evalResult.forcedPriority, null);
    assert.strictEqual(evalResult.evidence.length, 0);
  });
});
