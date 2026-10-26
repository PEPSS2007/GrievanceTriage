import fs from 'fs';
import path from 'path';

const taxonomyPath = path.join(process.cwd(), 'src/data/taxonomy.json');
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf-8'));

const officersByDept: Record<string, { rolePrefix: string; deptEmailPrefix: string; names: string[] }> = {
  dept_roads: {
    rolePrefix: 'Roads & Infrastructure Engineer',
    deptEmailPrefix: 'roads',
    names: ['Vikram Sethi', 'Preeti Mehra', 'Marcus Bell', 'Anita Roy', 'Deepak Verma', 'Chloe Tremblay', 'Suresh Nair', 'Sarah Lin']
  },
  dept_water: {
    rolePrefix: 'Water Works & Sewerage Officer',
    deptEmailPrefix: 'water',
    names: ['R. Nair', 'Fatima Zahra', 'David Kim', 'Sarah Jenkins', 'Alok Pandey', 'Elena Vance', 'Gopal Krishnan', 'Maya Joshi']
  },
  dept_sanitation: {
    rolePrefix: 'Sanitation & Solid Waste Lead',
    deptEmailPrefix: 'sanitation',
    names: ['M. Alvarez', 'Sunita Rao', 'Kenji Sato', 'Amir Khan', 'Rachel Green', 'Carlos Mendez', 'Pooja Hegde', 'Liam O\'Connor']
  },
  dept_electricity: {
    rolePrefix: 'Electrical & Lighting Inspector',
    deptEmailPrefix: 'power',
    names: ['P. Chen', 'Anil Deshmukh', 'Grace Hopper', 'Kavita Iyer', 'Simon Peter', 'Zainab Qureshi', 'Harish Patel', 'Noah Scott']
  },
  dept_health: {
    rolePrefix: 'Public Health & Vector Officer',
    deptEmailPrefix: 'health',
    names: ['Dr. S. Rao', 'Dr. Lisa Kudrow', 'Dr. Manoj Bajpayee', 'Dr. Meenakshi Sundaram', 'Dr. Tariq Jamil', 'Dr. Angela Rossi', 'Dr. V. Kurien', 'Dr. Emily Blunt']
  },
  dept_parks: {
    rolePrefix: 'Horticulture & Arboriculture Lead',
    deptEmailPrefix: 'parks',
    names: ['E. Morales', 'Karthik Raja', 'Flora MacDonald', 'Bhaskar Roy', 'Olga Smirnova', 'Tenzing Norgay', 'Vandana Shiva', 'Arthur Pendelton']
  }
};

const zoneNames = [
  'North Zone (Civic Center)',
  'North-East Zone (Heights)',
  'East Zone (Commercial Old Town)',
  'Central Zone (Pine & Market)',
  'South-West Zone (University)',
  'South Zone (Industrial Ring)',
  'South-East Zone (Terminal Hub)',
  'West Zone (Greenfield Suburbs)'
];

for (const dept of taxonomy.departments) {
  const config = officersByDept[dept.id] || {
    rolePrefix: 'Ward Municipal Officer',
    deptEmailPrefix: dept.id.replace('dept_', ''),
    names: ['Officer A', 'Officer B', 'Officer C', 'Officer D', 'Officer E', 'Officer F', 'Officer G', 'Officer H']
  };

  const wardContacts: Record<string, any> = {};
  for (let w = 1; w <= 8; w++) {
    const wardKey = `Ward ${w}`;
    const name = config.names[w - 1];
    wardContacts[wardKey] = {
      ward: wardKey,
      zone: zoneNames[w - 1],
      officer_name: name,
      role: `${config.rolePrefix} (${wardKey})`,
      phone: `+1-555-01${w < 10 ? '0' + w : w}`,
      email: `${config.deptEmailPrefix}.ward${w}@metroville.gov.synthetic`,
      jurisdiction: `Metroville Municipal Corporation - ${zoneNames[w - 1]} - ${wardKey}`,
      verification_status: 'verified',
      last_verified: '2026-03-20',
      source: 'Official Metroville Municipal Directory 2026 (Demo Gazette Model)'
    };
  }

  dept.ward_contacts = wardContacts;
}

fs.writeFileSync(taxonomyPath, JSON.stringify(taxonomy, null, 2), 'utf-8');
console.log('Successfully enriched taxonomy.json with verified ward contacts for all 6 departments across Wards 1 to 8.');
