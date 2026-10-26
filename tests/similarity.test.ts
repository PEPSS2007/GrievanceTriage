import { describe, it } from "node:test";
import assert from "node:assert";
import { TFIDFIndex } from "../src/core/similarity";
import { Complaint } from "../src/contracts";

describe("TF-IDF Cosine Similarity & Geo-Heuristics", () => {
  const c1: Complaint = {
    id: "CMP-001",
    text: "Huge water main burst outside 142 Pine Street. Water is gushing into road and flooded driveway.",
    location: "Ward 4, Pine Street",
    source: "Web Portal",
    created_at: new Date().toISOString(),
  };

  const c2: Complaint = {
    id: "CMP-002",
    text: "Water pipeline broken on Pine Street near corner. Street is completely flooded with water pooling.",
    location: "Ward 4, Pine Street",
    source: "Mobile App",
    created_at: new Date().toISOString(),
  };

  const cCrossLoc: Complaint = {
    id: "CMP-009",
    text: "Huge water main burst outside 142 Maple Avenue. Water is gushing into road and flooded driveway.",
    location: "Ward 12, Maple Avenue",
    source: "Web Portal",
    created_at: new Date().toISOString(),
  };

  const cUnrelated: Complaint = {
    id: "CMP-020",
    text: "Massive pile of rotting garbage accumulating on corner of Oak Ridge. Waste bin overflowing.",
    location: "Ward 7, Oak Ridge",
    source: "Web Portal",
    created_at: new Date().toISOString(),
  };

  it("identifies high similarity for complaints with lexical and geographic alignment", () => {
    const index = new TFIDFIndex();
    index.addDocument(c1.id, c1.text);
    index.addDocument(c2.id, c2.text);
    index.addDocument(cCrossLoc.id, cCrossLoc.text);
    index.addDocument(cUnrelated.id, cUnrelated.text);

    const related = index.findRelated(c1, [c1, c2, cCrossLoc, cUnrelated], "Water Supply & Sewage");
    const match = related.find((r) => r.candidate_id === "CMP-002");

    assert.ok(match, "CMP-002 should be in candidate list");
    assert.ok(match.similarity_score >= 0.65, `Expected score >= 0.65, got ${match.similarity_score}`);
    assert.ok(match.reasons.some((r) => r.includes("Geographic alignment")));
  });

  it("penalizes cross-location near-duplicates to prevent false clusters", () => {
    const index = new TFIDFIndex();
    index.addDocument(c1.id, c1.text);
    index.addDocument(cCrossLoc.id, cCrossLoc.text);

    const related = index.findRelated(c1, [c1, cCrossLoc], "Water Supply & Sewage");
    const crossMatch = related.find((r) => r.candidate_id === "CMP-009");

    assert.ok(crossMatch, "CMP-009 should be evaluated");
    assert.ok(crossMatch.reasons.some((r) => r.includes("Geographic separation")));
  });

  it("scores unrelated complaints very low", () => {
    const index = new TFIDFIndex();
    index.addDocument(c1.id, c1.text);
    index.addDocument(cUnrelated.id, cUnrelated.text);

    const related = index.findRelated(c1, [c1, cUnrelated], "Water Supply & Sewage");
    const unrelatedMatch = related.find((r) => r.candidate_id === "CMP-020");

    assert.strictEqual(unrelatedMatch, undefined, "Unrelated complaint should not meet score threshold");
  });
});
