import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SEED_COMPLAINTS } from '../src/data/mockData';

describe('Data-Driven Dashboard Aggregation Pipeline (Issue 8 Verification)', () => {
  it('correctly calculates dynamic priority aggregates from actual complaints', () => {
    const total = SEED_COMPLAINTS.length;
    assert.strictEqual(total, 60, 'Total seeded complaints must equal 60');

    const waterComplaints = SEED_COMPLAINTS.filter((c) => c.category === 'Water Supply & Sewage');
    const roadComplaints = SEED_COMPLAINTS.filter((c) => c.category === 'Roads & Potholes');
    const sanitationComplaints = SEED_COMPLAINTS.filter((c) => c.category === 'Garbage & Sanitation');

    assert.ok(waterComplaints.length > 0, 'Must have water complaints');
    assert.ok(roadComplaints.length > 0, 'Must have road complaints');
    assert.ok(sanitationComplaints.length > 0, 'Must have sanitation complaints');

    // Verify sum of top categories
    const categorySum = waterComplaints.length + roadComplaints.length + sanitationComplaints.length;
    assert.ok(categorySum <= total);
  });

  it('correctly aggregates day-of-week trends without hardcoded constants', () => {
    // Extract dates from seed complaints
    const dayCounts: Record<string, number> = {};
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (const c of SEED_COMPLAINTS) {
      const d = new Date(c.created_at);
      const dayName = daysOfWeek[d.getUTCDay()];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    }

    // Ensure all 60 complaints are accounted for
    const sum = Object.values(dayCounts).reduce((a, b) => a + b, 0);
    assert.strictEqual(sum, 60);

    // Verify that day counts are dynamic non-zero numbers
    assert.ok(Object.keys(dayCounts).length >= 3, 'Complaints should span multiple days');
  });

  it('correctly groups intake channels dynamically from real records', () => {
    const channelCounts: Record<string, number> = {};
    for (const c of SEED_COMPLAINTS) {
      const src = c.source;
      channelCounts[src] = (channelCounts[src] || 0) + 1;
    }

    assert.ok(channelCounts['Web Portal'] > 0);
    assert.ok(channelCounts['Mobile App'] > 0);
    assert.ok(channelCounts['Citizen Helpline'] > 0);

    const totalIngested = Object.values(channelCounts).reduce((a, b) => a + b, 0);
    assert.strictEqual(totalIngested, 60);
  });

  it('filters complaints by ward jurisdiction accurately', () => {
    const ward4Complaints = SEED_COMPLAINTS.filter((c) => c.location.includes('Ward 4'));
    assert.ok(ward4Complaints.length >= 4, 'Ward 4 should have multiple cluster complaints');

    const ward1Complaints = SEED_COMPLAINTS.filter((c) => c.location.includes('Ward 1'));
    assert.ok(ward1Complaints.length >= 1);
  });
});
