import {
  Complaint,
  Analysis,
  Decision,
  IncidentGroup,
  IncidentMember,
  Handoff,
  AuditLogEntry,
  Department,
  EscalationItem,
  PriorityType
} from '../types';
import taxonomyData from './taxonomy.json';

export const DEPARTMENTS: Department[] = (taxonomyData.departments as any[]).map(d => ({
  ...d,
  hours: d.hours || '24/7 Municipal Operations',
  verification_status: d.verification_status || 'verified',
  status: 'Available'
}));

export const WARD_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Ward 1': { lat: 28.6250, lng: 77.2000 },
  'Ward 2': { lat: 28.6300, lng: 77.2180 },
  'Ward 3': { lat: 28.6180, lng: 77.2280 },
  'Ward 4': { lat: 28.6100, lng: 77.2100 },
  'Ward 5': { lat: 28.6000, lng: 77.1950 },
  'Ward 6': { lat: 28.5950, lng: 77.2150 },
  'Ward 7': { lat: 28.6050, lng: 77.2300 },
  'Ward 8': { lat: 28.6350, lng: 77.2050 }
};

export const SEED_COMPLAINTS: Complaint[] = [
  // CMP-001 (Pine Street Water Leak - Lead Demo Case)
  {
    id: 'GRV-2026-1001',
    shortId: 'CMP-001',
    title: 'Water leak on Pine Street',
    text: 'Water main leak causing road damage and water wastage near Pine Street. Water has been bubbling through the asphalt since early morning and has created a deep trench.',
    location: 'Ward 4',
    lat: 28.6108,
    lng: 77.2115,
    source: 'Web Portal',
    created_at: '2026-04-28T09:15:00Z',
    category: 'Water Supply & Sewage',
    attachments: [
      {
        id: 'att-1001-1',
        name: 'pine_street_leak.jpg',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=600&q=80',
        size: 1420000,
        type: 'image/jpeg',
        uploaded_at: '2026-04-28T09:18:00Z',
        vision_summary: 'Visible high-volume water pooling on fractured asphalt roadway. Surface displacement evident with sediment runoff.',
        vision_confidence: 0.94
      }
    ]
  },
  // CMP-002
  {
    id: 'GRV-2026-1002',
    shortId: 'CMP-002',
    title: 'Garbage pileup near Market',
    text: 'Overflowing commercial waste containers outside Central Market. Rotten organic refuse encroaching on pedestrian walkway and attracting stray animals.',
    location: 'Ward 7',
    lat: 28.6045,
    lng: 77.2295,
    source: 'Mobile App',
    created_at: '2026-04-28T08:30:00Z',
    category: 'Garbage & Sanitation',
    attachments: [
      {
        id: 'att-1002-1',
        name: 'market_refuse.jpg',
        url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80',
        size: 980000,
        type: 'image/jpeg',
        uploaded_at: '2026-04-28T08:35:00Z',
        vision_summary: 'Commercial bins overflowing with organic waste onto public pedestrian corridor. High biohazard risk.',
        vision_confidence: 0.91
      }
    ]
  },
  // CMP-003
  {
    id: 'GRV-2026-1003',
    shortId: 'CMP-003',
    title: 'Streetlight not working',
    text: 'Dark streetlights along the 5th Avenue pedestrian crossway for three consecutive nights. Safety concern for transit commuters returning home.',
    location: 'Ward 2',
    lat: 28.6312,
    lng: 77.2170,
    source: 'Citizen Helpline',
    created_at: '2026-04-27T19:40:00Z',
    category: 'Street Lighting'
  },
  // CMP-004
  {
    id: 'GRV-2026-1004',
    shortId: 'CMP-004',
    title: 'Pothole on Main Rd',
    text: 'Deep crater pothole in the center lane of Main Road opposite commercial bank. Multiple two-wheelers suffering tyre damage.',
    location: 'Ward 6',
    lat: 28.5960,
    lng: 77.2140,
    source: 'Web Portal',
    created_at: '2026-04-27T14:10:00Z',
    category: 'Roads & Potholes',
    attachments: [
      {
        id: 'att-1004-1',
        name: 'asphalt_crater.jpg',
        url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
        size: 1250000,
        type: 'image/jpeg',
        uploaded_at: '2026-04-27T14:15:00Z',
        vision_summary: 'Asphalt pavement crater with exposed granular sub-base measuring approx 0.8m diameter in active traffic lane.',
        vision_confidence: 0.89
      }
    ]
  },
  // CMP-005
  {
    id: 'GRV-2026-1005',
    shortId: 'CMP-005',
    title: 'Low water pressure',
    text: 'Noticeable drop in residential drinking water supply pressure on 3rd floor apartments during scheduled morning supply hours.',
    location: 'Ward 3',
    lat: 28.6175,
    lng: 77.2270,
    source: 'SMS Gateway',
    created_at: '2026-04-26T07:20:00Z',
    category: 'Water Supply & Sewage'
  },
  // Related complaints in cluster
  {
    id: 'GRV-2026-1007',
    shortId: 'CMP-007',
    title: 'Water leak on Pine St',
    text: 'Gushing water near Pine Street bus stop from cracked underground pipeline.',
    location: 'Ward 4',
    lat: 28.6115,
    lng: 77.2105,
    source: 'Mobile App',
    created_at: '2026-04-28T09:45:00Z',
    category: 'Water Supply & Sewage'
  },
  {
    id: 'GRV-2026-1012',
    shortId: 'CMP-012',
    title: 'Burst pipe on Oak Ave',
    text: 'Pressurized water torrent flooding sidewalk curb two blocks from Pine Street junction.',
    location: 'Ward 4',
    lat: 28.6095,
    lng: 77.2125,
    source: 'Citizen Helpline',
    created_at: '2026-04-28T10:05:00Z',
    category: 'Water Supply & Sewage'
  },
  {
    id: 'GRV-2026-1018',
    shortId: 'CMP-018',
    title: 'Low pressure in area',
    text: 'Complete loss of water tap pressure across Pine and Oak residential block.',
    location: 'Ward 4',
    lat: 28.6120,
    lng: 77.2085,
    source: 'Web Portal',
    created_at: '2026-04-28T10:20:00Z',
    category: 'Water Supply & Sewage'
  },
  {
    id: 'GRV-2026-1021',
    shortId: 'CMP-021',
    title: 'Water leakage near school',
    text: 'Water pooling on pavement near elementary school gate corner.',
    location: 'Ward 5',
    lat: 28.6010,
    lng: 77.1960,
    source: 'Walk-in Desk',
    created_at: '2026-04-28T11:00:00Z',
    category: 'Water Supply & Sewage'
  },
  {
    id: 'GRV-2026-1027',
    shortId: 'CMP-027',
    title: 'Repeated garbage pileup',
    text: 'Sanitation truck skipped scheduled Sunday collection for second week in Market sector.',
    location: 'Ward 7',
    lat: 28.6060,
    lng: 77.2315,
    source: 'Mobile App',
    created_at: '2026-04-25T11:00:00Z',
    category: 'Garbage & Sanitation'
  },
  {
    id: 'GRV-2026-1041',
    shortId: 'CMP-041',
    title: 'Blocked drain flooding street',
    text: 'Storm drainage culvert blocked by heavy silt and construction runoff, overflowing into hospital access ramp.',
    location: 'Ward 1',
    lat: 28.6265,
    lng: 77.1985,
    source: 'Citizen Helpline',
    created_at: '2026-04-23T16:00:00Z',
    category: 'Water Supply & Sewage',
    attachments: [
      {
        id: 'att-1041-1',
        name: 'culvert_overflow.jpg',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=600&q=80',
        size: 1100000,
        type: 'image/jpeg',
        uploaded_at: '2026-04-23T16:05:00Z',
        vision_summary: 'Heavy silt and debris blocking reinforced concrete stormwater culvert; water overflowing onto vehicular access ramp.',
        vision_confidence: 0.93
      }
    ]
  }
];

// Fill up to 60 complaints with realistic municipal categories and coordinates
const extraCategories = [
  'Water Supply & Sewage',
  'Roads & Potholes',
  'Garbage & Sanitation',
  'Street Lighting',
  'Electrical Hazards'
];

const existingIds = new Set(SEED_COMPLAINTS.map(c => c.id));
for (let i = 1; i <= 60; i++) {
  const compId = `GRV-2026-${1000 + i}`;
  if (existingIds.has(compId)) continue;

  const shortNum = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
  const cat = extraCategories[i % extraCategories.length];
  const wardNum = (i % 8) + 1;
  const wardKey = `Ward ${wardNum}`;
  const day = 28 - (i % 7);

  // Complaints 56 to 60 are deliberately unlocated to test unlocated complaints workflow
  const isUnlocated = i >= 56;
  const baseCoord = WARD_COORDINATES[wardKey] || { lat: 28.6139, lng: 77.2090 };
  const jitterLat = ((i % 7) - 3) * 0.0022;
  const jitterLng = (((i * 3) % 7) - 3) * 0.0022;

  SEED_COMPLAINTS.push({
    id: compId,
    shortId: `CMP-${shortNum}`,
    title: `${cat} report in ${wardKey}`,
    text: `Municipal service request regarding ${cat.toLowerCase()} near public crossroad. Resident notes need for inspection.`,
    location: isUnlocated ? 'Metroville (Unverified Coordinates)' : wardKey,
    lat: isUnlocated ? undefined : Number((baseCoord.lat + jitterLat).toFixed(5)),
    lng: isUnlocated ? undefined : Number((baseCoord.lng + jitterLng).toFixed(5)),
    source: i % 4 === 0 ? 'CSV Import' : i % 3 === 0 ? 'Mobile App' : i % 2 === 0 ? 'Web Portal' : 'Citizen Helpline',
    created_at: `2026-04-${day < 10 ? '0' + day : day}T10:00:00Z`,
    category: cat
  });
}

// Precomputed Analyses for all seeded complaints
export const SEED_ANALYSES: Record<string, Analysis> = {
  'GRV-2026-1001': {
    complaint_id: 'GRV-2026-1001',
    summary: 'Water main leak causing road damage and water wastage near Pine Street.',
    category: 'Water Supply & Sewage',
    priority: 'High',
    priority_evidence: [
      'Water leak keyword match in description',
      'Location: Ward 4 (high risk zone)',
      'Repeated reports: 3 similar nearby submissions within 2 hours'
    ],
    department_id: 'dept_water',
    action: 'Dispatch repair crew within 24h',
    uncertainties: ['Pipe caliber unverified pending valve box opening'],
    method: 'ai',
    confidence: 0.92
  },
  'GRV-2026-1002': {
    complaint_id: 'GRV-2026-1002',
    summary: 'Rotten commercial waste accumulation blocking market alley.',
    category: 'Garbage & Sanitation',
    priority: 'High',
    priority_evidence: ['Public health biohazard risk', 'Pedestrian passage blocked'],
    department_id: 'dept_sanitation',
    action: 'Dispatch heavy compactor truck and sanitization spray',
    uncertainties: [],
    method: 'ai',
    confidence: 0.89
  },
  'GRV-2026-1003': {
    complaint_id: 'GRV-2026-1003',
    summary: 'Dark streetlights creating pedestrian safety hazard along 5th Ave.',
    category: 'Street Lighting',
    priority: 'High',
    priority_evidence: ['Public safety corridor', 'Repeated 3-day outage'],
    department_id: 'dept_electricity',
    action: 'Replace blown transformer fuse / circuit breaker',
    uncertainties: [],
    method: 'ai',
    confidence: 0.91
  },
  'GRV-2026-1004': {
    complaint_id: 'GRV-2026-1004',
    summary: 'Asphalt crater on Main Road causing vehicle swerve and tyre puncture.',
    category: 'Roads & Potholes',
    priority: 'Medium',
    priority_evidence: ['Traffic lane obstruction', 'Commercial zone'],
    department_id: 'dept_roads',
    action: 'Schedule cold-patch asphalt repair unit',
    uncertainties: [],
    method: 'ai',
    confidence: 0.88
  },
  'GRV-2026-1005': {
    complaint_id: 'GRV-2026-1005',
    summary: 'Residential water pressure drop on 3rd floor apartments.',
    category: 'Water Supply & Sewage',
    priority: 'Low',
    priority_evidence: ['Routine pressure fluctuation; non-emergency'],
    department_id: 'dept_water',
    action: 'Check ward pressure regulator station',
    uncertainties: [],
    method: 'fallback',
    confidence: 0.76
  }
};

// Ensure EVERY complaint in SEED_COMPLAINTS has is_demo set and a content-dependent analysis
for (const c of SEED_COMPLAINTS) {
  c.is_demo = true;
  if (!SEED_ANALYSES[c.id]) {
    const isUrgent = c.category === 'Electrical Hazards' || c.text.toLowerCase().includes('wire') || c.text.toLowerCase().includes('manhole');
    const isHigh = c.category === 'Water Supply & Sewage' || c.text.toLowerCase().includes('burst') || c.text.toLowerCase().includes('overflow');
    const isMedium = c.category === 'Roads & Potholes' || c.category === 'Street Lighting';

    const prio: PriorityType = isUrgent ? 'Critical' : isHigh ? 'High' : isMedium ? 'Medium' : 'Low';
    const deptId = c.category?.includes('Water')
      ? 'dept_water'
      : c.category?.includes('Road')
      ? 'dept_roads'
      : c.category?.includes('Garbage')
      ? 'dept_sanitation'
      : c.category?.includes('Light') || c.category?.includes('Electric')
      ? 'dept_electricity'
      : 'dept_roads';

    const actionMap: Record<PriorityType, string> = {
      Critical: 'Immediate emergency dispatch within 2 hours.',
      High: 'Schedule priority crew inspection within 24 hours.',
      Medium: 'Assign to department queue under standard SLA.',
      Low: 'Queue for scheduled ward maintenance route.'
    };

    SEED_ANALYSES[c.id] = {
      complaint_id: c.id,
      summary: `${c.title}. Issue involves ${c.category?.toLowerCase() || 'municipal works'} in ${c.location}.`,
      category: c.category || 'General / Other',
      priority: prio,
      priority_evidence: [
        `Matched keyword in description (${c.category})`,
        `Jurisdiction: ${c.location}`,
        `Intake source: ${c.source}`
      ],
      department_id: deptId,
      action: actionMap[prio],
      uncertainties: c.location.includes('Unverified') ? ['Geographic coordinates unverified pending citizen or officer pin drop'] : [],
      method: 'rules',
      confidence: 0.86
    };
  }
}

// Seed Decisions
export const SEED_DECISIONS: Record<string, Decision> = {
  // CMP-001 starts in Pending Review for demo
  'GRV-2026-1003': {
    complaint_id: 'GRV-2026-1003',
    category: 'Street Lighting',
    priority: 'High',
    department_id: 'dept-power',
    action: 'Replace blown transformer fuse',
    status: 'In Review',
    reviewer_note: 'Assigned to power safety team for night shift inspection.',
    decided_at: '2026-04-27T20:15:00Z'
  },
  'GRV-2026-1004': {
    complaint_id: 'GRV-2026-1004',
    category: 'Roads & Potholes',
    priority: 'Medium',
    department_id: 'dept-roads',
    action: 'Schedule cold-patch asphalt repair unit',
    status: 'Approved',
    reviewer_note: 'Approved for morning road maintenance route.',
    decided_at: '2026-04-27T15:00:00Z'
  },
  'GRV-2026-1005': {
    complaint_id: 'GRV-2026-1005',
    category: 'Water Supply & Sewage',
    priority: 'Low',
    department_id: 'dept-water',
    action: 'Check ward pressure regulator station',
    status: 'Open',
    reviewer_note: 'Logged in water utility queue.',
    decided_at: '2026-04-26T08:00:00Z'
  }
};

// Incident Cluster & Members
export const SEED_INCIDENT_GROUPS: IncidentGroup[] = [
  {
    group_id: 'INC-WTR-401',
    title: 'Pine Street Water Main Rupture & Area Low Pressure',
    category: 'Water Supply & Sewage',
    lead_complaint_id: 'GRV-2026-1001',
    created_at: '2026-04-28T09:15:00Z',
    status: 'active'
  }
];

export const SEED_INCIDENT_MEMBERS: IncidentMember[] = [
  { group_id: 'INC-WTR-401', complaint_id: 'GRV-2026-1007', score: 0.87, relationship_status: 'suggested' },
  { group_id: 'INC-WTR-401', complaint_id: 'GRV-2026-1012', score: 0.72, relationship_status: 'suggested' },
  { group_id: 'INC-WTR-401', complaint_id: 'GRV-2026-1018', score: 0.68, relationship_status: 'suggested' },
  { group_id: 'INC-WTR-401', complaint_id: 'GRV-2026-1021', score: 0.61, relationship_status: 'suggested' }
];

// Escalations Queue Data matching Section 8
export const SEED_ESCALATIONS: EscalationItem[] = [
  {
    id: 'esc-001',
    complaintId: 'GRV-2026-1003',
    shortId: 'CMP-003',
    issue: 'Streetlight not working',
    level: 2,
    daysOpen: 3,
    status: 'Escalated',
    department: 'Urban Electricity & Street Lighting'
  },
  {
    id: 'esc-002',
    complaintId: 'GRV-2026-1012',
    shortId: 'CMP-012',
    issue: 'Burst pipe on Oak Ave',
    level: 2,
    daysOpen: 2,
    status: 'Escalated',
    department: 'Water Department'
  },
  {
    id: 'esc-003',
    complaintId: 'GRV-2026-1018',
    shortId: 'CMP-018',
    issue: 'Low water pressure',
    level: 1,
    daysOpen: 1,
    status: 'Pending',
    department: 'Water Department'
  },
  {
    id: 'esc-004',
    complaintId: 'GRV-2026-1027',
    shortId: 'CMP-027',
    issue: 'Repeated garbage',
    level: 1,
    daysOpen: 1,
    status: 'Pending',
    department: 'Public Health & Solid Waste'
  },
  {
    id: 'esc-005',
    complaintId: 'GRV-2026-1041',
    shortId: 'CMP-041',
    issue: 'Blocked drain',
    level: 3,
    daysOpen: 5,
    status: 'Escalated',
    department: 'Water Department'
  }
];

// Handoff timeline events
export const SEED_HANDOFFS: Handoff[] = [
  {
    id: 'hnd-001',
    complaint_id: 'GRV-2026-1001',
    department_id: 'dept-water',
    channel: 'email',
    message: 'Please dispatch a repair crew to Pine Street, Ward 4. This is a water main leak requiring urgent attention.',
    status: 'Initiated',
    follow_up_at: '2026-04-29T09:15:00Z',
    type: 'handoff',
    created_at: '2026-04-28T14:30:00Z'
  }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    entity: 'decision',
    entity_id: 'CMP-001',
    before: null,
    after: { status: 'Approved' },
    note: 'Reviewer approved recommendation for Water Department dispatch',
    created_at: '2026-04-28T11:30:00Z',
    actor: 'Officer Sarah'
  },
  {
    id: 'aud-002',
    entity: 'handoff',
    entity_id: 'CMP-001',
    before: null,
    after: { status: 'Contact Initiated' },
    note: 'Department contacted via operational email dispatch',
    created_at: '2026-04-28T14:30:00Z',
    actor: 'System'
  },
  {
    id: 'aud-003',
    entity: 'handoff',
    entity_id: 'CMP-001',
    before: null,
    after: { escalation_level: 'Level 2' },
    note: 'Escalation added due to road pavement wash-away threat',
    created_at: '2026-04-29T09:15:00Z',
    actor: 'Officer Sarah'
  }
];

export const TREND_DATA = [
  { day: 'Mon', total: 18, resolved: 10 },
  { day: 'Tue', total: 24, resolved: 15 },
  { day: 'Wed', total: 22, resolved: 14 },
  { day: 'Thu', total: 32, resolved: 20 },
  { day: 'Fri', total: 28, resolved: 18 },
  { day: 'Sat', total: 34, resolved: 24 },
  { day: 'Sun', total: 26, resolved: 16 }
];

export const TOP_ISSUES = [
  { name: 'Water Supply', count: 18, color: 'text-blue-500', bg: 'bg-blue-50' },
  { name: 'Roads & Potholes', count: 12, color: 'text-amber-500', bg: 'bg-amber-50' },
  { name: 'Garbage & Sanitation', count: 10, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { name: 'Street Lighting', count: 8, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { name: 'Electrical Hazards', count: 6, color: 'text-red-500', bg: 'bg-red-50' }
];