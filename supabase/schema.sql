-- CivicSignal AI: Database DDL Schema
-- Compatible with Supabase Postgres

-- 1. Departments table
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    categories TEXT[] NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    portal TEXT,
    escalation_contact TEXT NOT NULL,
    sla_hours INTEGER NOT NULL DEFAULT 48,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    location TEXT NOT NULL,
    ward TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    source TEXT NOT NULL DEFAULT 'Phone',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    reporting_person JSONB,
    source_reference TEXT,
    receiving_officer TEXT,
    officer_notes TEXT,
    attachments JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.1 Resolution Evidence table
CREATE TABLE IF NOT EXISTS resolution_evidence (
    id TEXT PRIMARY KEY,
    complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    action_taken TEXT,
    work_order_ref TEXT,
    officer_name TEXT NOT NULL,
    department_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    after_photo_url TEXT,
    after_photo_name TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    stage TEXT NOT NULL DEFAULT 'department_reported_resolved',
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    verification_note TEXT,
    rejection_reason TEXT,
    evidence_reviewed JSONB DEFAULT '[]',
    exception_documented BOOLEAN DEFAULT FALSE,
    exception_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AI Triage Analyses table
CREATE TABLE IF NOT EXISTS analyses (
    complaint_id TEXT PRIMARY KEY REFERENCES complaints(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    priority_evidence JSONB NOT NULL DEFAULT '[]',
    recommended_department_id TEXT NOT NULL REFERENCES departments(id),
    suggested_action TEXT NOT NULL,
    uncertainties JSONB NOT NULL DEFAULT '[]',
    needs_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    redacted_pii_count INTEGER NOT NULL DEFAULT 0,
    suspicious_text_detected BOOLEAN NOT NULL DEFAULT FALSE,
    method TEXT NOT NULL DEFAULT 'ai',
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.85,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Human Review Decisions table
CREATE TABLE IF NOT EXISTS decisions (
    complaint_id TEXT PRIMARY KEY REFERENCES complaints(id) ON DELETE CASCADE,
    approved_category TEXT NOT NULL,
    approved_priority TEXT NOT NULL,
    approved_department_id TEXT NOT NULL REFERENCES departments(id),
    status TEXT NOT NULL DEFAULT 'Approved',
    reviewer_note TEXT,
    override_reason TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Incident Intelligence & Clustering
CREATE TABLE IF NOT EXISTS incident_groups (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_members (
    group_id TEXT NOT NULL REFERENCES incident_groups(id) ON DELETE CASCADE,
    complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    similarity_score NUMERIC(3, 2) NOT NULL,
    reasons JSONB NOT NULL DEFAULT '[]',
    membership_status TEXT NOT NULL DEFAULT 'suggested', -- 'suggested' | 'confirmed' | 'rejected'
    PRIMARY KEY (group_id, complaint_id)
);

-- 6. Handoffs and Escalations
CREATE TABLE IF NOT EXISTS handoffs (
    id TEXT PRIMARY KEY,
    complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id),
    channel TEXT NOT NULL DEFAULT 'email',
    message_draft TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Prepared', -- 'Prepared' | 'Initiated' | 'Acknowledged'
    follow_up_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escalations (
    id BIGSERIAL PRIMARY KEY,
    complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    follow_up_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Immutable Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    before_state JSONB,
    after_state JSONB,
    reviewer TEXT NOT NULL DEFAULT 'Prototype Reviewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast querying & filtering
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(location);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_analyses_priority ON analyses(priority);
CREATE INDEX IF NOT EXISTS idx_analyses_category ON analyses(category);
CREATE INDEX IF NOT EXISTS idx_incident_members_group ON incident_members(group_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_complaint ON handoffs(complaint_id);

-- Enable Row Level Security (RLS)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Read-only policy for anonymous users (Dashboard viewing)
CREATE POLICY "Public read departments" ON departments FOR SELECT TO anon USING (true);
CREATE POLICY "Public read complaints" ON complaints FOR SELECT TO anon USING (true);
CREATE POLICY "Public read analyses" ON analyses FOR SELECT TO anon USING (true);
CREATE POLICY "Public read decisions" ON decisions FOR SELECT TO anon USING (true);
CREATE POLICY "Public read incident_groups" ON incident_groups FOR SELECT TO anon USING (true);
CREATE POLICY "Public read incident_members" ON incident_members FOR SELECT TO anon USING (true);
CREATE POLICY "Public read handoffs" ON handoffs FOR SELECT TO anon USING (true);
CREATE POLICY "Public read escalations" ON escalations FOR SELECT TO anon USING (true);
CREATE POLICY "Public read audit_log" ON audit_log FOR SELECT TO anon USING (true);

-- Full read-write policy for service role (Server-side API handlers only)
CREATE POLICY "Service role full access departments" ON departments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access complaints" ON complaints FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access analyses" ON analyses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access decisions" ON decisions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access incident_groups" ON incident_groups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access incident_members" ON incident_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access handoffs" ON handoffs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access escalations" ON escalations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access audit_log" ON audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);
