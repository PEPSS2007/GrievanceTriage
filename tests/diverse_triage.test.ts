import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runDeterministicFallback } from '../src/core/fallback';
import { triageComplaint } from '../src/core/triage';

describe('Diverse Grievance Triage Pipeline (Issue 4 Verification)', () => {
  it('correctly classifies a large pothole causing road damage', async () => {
    const text = 'A large pothole on 4th Avenue is causing severe road surface damage and broken axles for cars.';
    const res = runDeterministicFallback('TST-001', text, 'Ward 3, 4th Avenue', 0, false);

    assert.strictEqual(res.category, 'Roads & Footpaths');
    assert.strictEqual(res.recommended_department_id, 'dept_roads');
    assert.ok(res.summary.includes('roads & footpaths'));
    assert.ok(res.confidence >= 0.75);
    assert.ok(res.suggested_action.length > 0);
  });

  it('correctly classifies sewage overflowing into a residential street', async () => {
    const text = 'Raw sewage is overflowing from the drain onto the residential street near house #45 with unbearable foul odor.';
    const res = runDeterministicFallback('TST-002', text, 'Ward 2, Maple St', 0, false);

    assert.strictEqual(res.category, 'Water Supply & Sewage');
    assert.strictEqual(res.recommended_department_id, 'dept_water');
    assert.ok(res.summary.includes('water supply & sewage'));
    assert.ok(res.confidence >= 0.75);
  });

  it('correctly classifies a neighborhood experiencing a water shortage', async () => {
    const text = 'Entire neighborhood has no water supply for 48 hours; low pressure trickling and dry taps across all blocks.';
    const res = runDeterministicFallback('TST-003', text, 'Ward 7, Sector 9', 0, false);

    assert.strictEqual(res.category, 'Water Supply & Sewage');
    assert.strictEqual(res.recommended_department_id, 'dept_water');
    assert.ok(res.summary.includes('water supply & sewage'));
  });

  it('correctly classifies a broken streetlight in a dark public area', async () => {
    const text = 'Broken streetlight on the dark road pedestrian path outside community center. Completely unlit for 4 nights.';
    const res = runDeterministicFallback('TST-004', text, 'Ward 5, Park Road', 0, false);

    assert.strictEqual(res.category, 'Street Lighting & Electricity');
    assert.strictEqual(res.recommended_department_id, 'dept_electricity');
    assert.ok(res.summary.includes('street lighting & electricity'));
    assert.ok(res.confidence >= 0.75);
  });

  it('correctly flags a complaint with insufficient information for human review', async () => {
    const text = 'Fix this immediately please';
    const res = runDeterministicFallback('TST-005', text, 'Ward 1', 0, false);

    assert.ok(res.confidence <= 0.65, 'Confidence must be lower for vague input');
    assert.strictEqual(res.needs_human_review, true, 'Vague complaint must require human review');
    assert.ok(res.uncertainties.length > 0, 'Must record uncertainty reasons');
    assert.ok(
      res.uncertainties.some((u) => u.toLowerCase().includes('no explicit category') || u.toLowerCase().includes('short')),
      'Must explain why certainty is low'
    );
  });

  it('ensures distinct inputs do NOT receive identical summaries or departments', () => {
    const pothole = runDeterministicFallback('TST-001', 'Huge pothole crater in pavement', 'Ward 1', 0, false);
    const sewage = runDeterministicFallback('TST-002', 'Sewage drain overflow flooding sidewalk', 'Ward 2', 0, false);
    const light = runDeterministicFallback('TST-003', 'Streetlight dark road pole flickering', 'Ward 3', 0, false);

    assert.notStrictEqual(pothole.category, sewage.category);
    assert.notStrictEqual(pothole.recommended_department_id, light.recommended_department_id);
    assert.notStrictEqual(sewage.recommended_department_id, light.recommended_department_id);
    assert.notStrictEqual(pothole.summary, sewage.summary);
  });
});
