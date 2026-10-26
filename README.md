<<<<<<< HEAD
# GrievanceTriage — Municipal Grievance Triage & Resolution Platform

**GrievanceTriage** is an AI-assisted municipal grievance intake, automated triage, and verified resolution platform engineered for municipal corporations, urban local bodies, and public works administrations.

It provides complete end-to-end grievance lifecycle management — from multi-channel citizen ingestion and computer vision evidence analysis to interactive GIS mapping, ward-level contact assignment, and multi-stage physical resolution verification.

---

## Key Capabilities & Core Architecture

### 1. Standardized Official Identity
- Official system identity: **GrievanceTriage** (`v1.0`).
- Consistent municipal branding across browser metadata, navigation headers, sidebars, dashboard metrics, and localized interfaces.

### 2. Persistent Review & Audit History
- Every administrative action (review approval, priority/category override, department reassignment, escalation, resolution verification, and citizen dispute) records a structured audit event.
- **Audit Schema**: `entity`, `entity_id`, `before`, `after`, `actor`, `note`, and ISO `created_at`.
- Endpoints: `GET /api/audit`, `POST /api/audit`, `GET /api/complaints/[id]/audit`.
- Chronological timeline rendered dynamically on complaint detail screens.
- Dual storage support: Persistent PostgreSQL via Supabase, with an in-memory fallback that transparently communicates session persistence boundaries.

### 3. Interactive Leaflet GIS Complaint Map
- Full interactive mapping powered by **Leaflet** and live **OpenStreetMap** tile layers (`/components/map/LeafletMapInner.tsx`).
- Real coordinate plotting (`lat` / `lng`) across Metroville jurisdiction (Wards 1–8).
- Priority color-coded pins (Red: Critical/Urgent, Orange: High, Blue: Medium, Green: Low).
- Interactive marker popups displaying Complaint ID, Category, Priority, Status, and a direct navigation link to Complaint Detail.
- Multi-dimensional filtering: Filter simultaneously by Ward (Wards 1–8), Department, Priority, and Status.
- **Unlocated Complaints Drawer**: Complaints lacking verified geographic coordinates are grouped into an unlocated drawer, supporting manual map pin-drop and geocoding assignment without inventing fake markers.

### 4. Diverse, Content-Dependent AI Triage
- Triage pipeline traces from `/api/analyze` → `src/core/pii.ts` → `src/core/guardrails.ts` → `src/core/rules.ts` → `src/core/llm.ts` → `src/core/fallback.ts`.
- Redacts PII (phone numbers, emails, national identity numbers) and flags adversarial prompt injections.
- Removes hardcoded dummy responses: dynamically extracts keywords, emergency safety indicators, and jurisdiction context to assign distinct categories, priorities, and departments.
- Transparent methodology labels: explicitly denotes whether a classification was generated via `ai`, `fallback`, or `rules`.
- Automated test suite (`tests/diverse_triage.test.ts`) verifies distinct outputs across 5 diverse grievance types:
  1. Road pothole causing vehicular damage → Roads & Bridges Dept (Medium/High).
  2. Sewage overflow onto pedestrian walkway → Water Supply & Sewage (High).
  3. Neighborhood-wide water shortage → Water Supply & Sewage (High).
  4. Non-functional streetlight in dark public area → Lighting & Power (Medium).
  5. Insufficient/vague text → Flagged for human review with low confidence.

### 5. Multi-Modal Vision & Photographic Evidence
- Citizen and officer photo upload support during submission and review.
- Client and server validation for MIME types (`image/jpeg`, `image/png`, `image/webp`) and file sizes (<5MB).
- Vision analysis endpoint: `POST /api/analyze/vision`.
- Multi-modal visual reasoning (via live Gemini 1.5 Flash Vision or transparent rule-informed visual evidence classifier) returning visible observations, inferred relevance, uncertainties, and method disclaimer.
- One-click **"Re-analyze Complaint"** button on Complaint Detail that fuses photographic observations with textual evidence and updates triage confidence.

### 6. Location-Aware Department & Ward Contact Resolution
- Configurable municipal taxonomy directory (`src/data/taxonomy.json`) mapping 6 core departments across Wards 1 through 8.
- Resolves official ward engineers and nodal officers (Officer Name, Title, Official Phone, Official Email, Ward Jurisdiction, and Verification Status).
- Boundary awareness: Displays **"Contact Not Verified"** with manual assignment workflows whenever a complaint's location falls outside mapped municipal jurisdictions.

### 7. Structured Information Requests & Citizen Replies
- Formal two-way clarification loop for incomplete grievances.
- Officers record structured requests (`message`, `recipient`, `deadline`).
- Citizen response interface supporting supplemental text and photo attachments.
- Automatic status transition (`Under Review`) and re-triage incorporating citizen responses, preserving full prior audit history.

### 8. Data-Driven Metrics & Dashboard Trends
- Real-time aggregation of complaint records across configurable timeframes (7 Days, 30 Days, 90 Days).
- Dynamic SVG cubic bezier trend curves calculated directly from timestamp boundaries (`src/components/dashboard/OverviewDashboard.tsx`).
- Live category volume percentages and department workload queues.
- Verified data integrity: Zero hardcoded SVG coordinate arrays.

### 9. Multi-Stage Resolution Verification Workflow
- Replaces unverified single-click closures with a multi-stage physical verification lifecycle:
  `Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolution Submitted` → `Verification Pending` → `Resolved` (or `Reopened`).
- Field officers submit resolution notes, completion timestamps, and after-repair photo evidence (`POST /api/resolution`).
- Senior administrators inspect submitted proof to verify (`PATCH /api/resolution`).
- Citizens can confirm resolution or dispute and reopen persisting issues with reasons recorded in the audit log.

### 10. Multi-Channel Intake & Ingestion Hub
- Dedicated ingestion console (`/components/intake/IntakeChannelsView.tsx`):
  1. **Citizen Web Portal**: Public form with location selector, category recommendation, and photo upload.
  2. **Officer Assisted Entry**: Manual municipal counter intake.
  3. **Bulk Municipal CSV Ingestion**: CSV parser with schema validation, preview table, duplicate detection, and rejected row accounting.
  4. **Integration-Ready Webhook API** (`POST /api/intake/webhook`): Bearer token authentication, idempotency/deduplication checks, structured triage return, and developer cURL sandbox.

---

## Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions & API Routes)
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS & Vanilla CSS Design System
- **Mapping & GIS**: Leaflet 1.9 & OpenStreetMap Tiles
- **Icons**: Lucide React
- **Validation**: Zod Schemas
- **Database**: PostgreSQL (Supabase) + Resilient In-Memory Offline Store
- **Testing**: Node.js Native Test Runner with `tsx`

---

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (Optional for Live External Services)
Copy `.env.example` to `.env.local` if configuring external services:
```env
# Optional: Supabase Database & Private Storage
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key

# Optional: Google Gemini Live LLM & Vision
GEMINI_API_KEY=your-gemini-api-key

# Webhook Ingestion API Security
WEBHOOK_SECRET_KEY=gov-grievance-webhook-secret-key-2026
```
> **Note**: GrievanceTriage operates fully in **Demo / Offline Mode** without API keys, utilizing seeded municipal complaints, deterministic fallback triage, and local storage state persistence.

### 3. Run Automated Tests
```bash
npm test
```
Executes 57 test assertions across 11 test suites verifying triage classification, PII redaction, GIS similarity, lifecycle transitions, dashboard aggregates, and API endpoints.

### 4. Build for Production
```bash
npm run build
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze` | `POST` | Triage grievance text, redact PII, evaluate safety rules, return category, priority, and department |
| `/api/analyze/vision` | `POST` | Multi-modal visual anomaly analysis of uploaded photographic evidence |
| `/api/audit` | `GET` / `POST` | Retrieve and record structured audit history events |
| `/api/complaints` | `GET` | Retrieve complaint records with filters for ward, department, priority, and status |
| `/api/complaints/[id]/audit` | `GET` | Retrieve chronological audit history for a specific complaint |
| `/api/departments` | `GET` | List verified municipal departments and authorized ward contacts |
| `/api/escalate` | `POST` | Escalate overdue complaint to Level 1, 2, or 3 with SLA targets |
| `/api/handoff` | `POST` | Initiate formal department contact via email, portal, or phone |
| `/api/intake/webhook` | `POST` | Secure external webhook ingestion for municipal grievance systems |
| `/api/related` | `GET` | TF-IDF and geographic proximity search for duplicate or cluster candidates |
| `/api/reset-demo` | `POST` | Reset in-memory database to initial 60 seeded municipal complaints |
| `/api/resolution` | `POST` / `PATCH` | Submit resolution proof, verify physical completion, or record citizen dispute |
| `/api/review` | `POST` | Administrative review decision (Approve, Override, Reject, Request Info) |

---

## Evaluation Benchmark
Run the automated triage evaluation benchmark against 60 synthetic municipal test cases:
```bash
npm run benchmark
```
Detailed performance and category accuracy metrics are documented in `BENCHMARK.md`.

---

## License
Proprietary — Engineered for municipal grievance management and public service triage.
=======
# GrievanceTriage
>>>>>>> abdb6549e8f4841ac3f3b5fd50ce8964059a7333
