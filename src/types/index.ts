export type PriorityType = 'Low' | 'Medium' | 'High' | 'Critical';

export type StatusType =
  | 'Submitted'
  | 'Under Review'
  | 'Pending Review'
  | 'Assigned'
  | 'In Progress'
  | 'Needs More Information'
  | 'Contact Prepared'
  | 'Contact Initiated'
  | 'Acknowledged'
  | 'Resolution Submitted'
  | 'Verification Pending'
  | 'Verified Resolved'
  | 'Rejected — Further Action Required'
  | 'Resolved'
  | 'Rejected'
  | 'Reopened'
  | 'Escalated'
  | 'Open'
  | 'Open / Under Review'
  | 'In Review'
  | 'Approved';

export type MethodType = 'ai' | 'fallback' | 'rules' | 'vision';

export type VerificationStatus = 'verified' | 'unverified' | 'pending';

export type RelationshipStatus = 'suggested' | 'confirmed' | 'rejected';

export type HandoffStatus = 'Prepared' | 'Initiated' | 'Acknowledged';

export type IntakeChannel =
  | 'Phone'
  | 'Email'
  | 'In Person'
  | 'Existing Government Portal'
  | 'Other'
  | 'Web Portal'
  | 'Mobile App'
  | 'Citizen Helpline'
  | 'SMS Gateway'
  | 'Walk-in Desk'
  | 'CSV Import'
  | 'Integration API';

export interface WardContact {
  ward: string;
  zone: string;
  officer_name: string;
  role: string;
  phone: string;
  email: string;
  verification_status: VerificationStatus;
  jurisdiction?: string;
  last_verified: string;
  source: string;
}

export interface Department {
  id: string;
  name: string;
  categories: string[];
  email: string;
  phone: string;
  hours: string;
  website: string;
  portal: string;
  escalation_contact: string;
  verification_status: VerificationStatus;
  is_demo: boolean;
  status?: 'Available' | 'Busy' | 'Off-duty';
  ward_contacts?: Record<string, WardContact>;
}

export interface ComplaintAttachment {
  id: string;
  name: string;
  url: string; // Base64 data URI or storage URL
  size: number;
  type: string;
  uploaded_at: string;
  vision_summary?: string;
  vision_confidence?: number;
}

export interface Complaint {
  id: string;
  shortId: string; // e.g. "CMP-001"
  title?: string;
  text: string;
  created_at: string;
  location: string;
  ward?: string;
  lat?: number;
  lng?: number;
  source: IntakeChannel;
  category?: string;
  attachments?: ComplaintAttachment[];
  is_demo?: boolean;
  reporting_person?: {
    name?: string;
    contact?: string;
  };
  source_reference?: string;
  receiving_officer?: string;
  officer_notes?: string;
}

export interface Analysis {
  complaint_id: string;
  summary: string;
  category: string;
  priority: PriorityType;
  priority_evidence: string[];
  department_id: string;
  recommended_department_id?: string;
  action: string;
  suggested_action?: string;
  uncertainties: string[];
  method: MethodType;
  confidence: number;
  image_analysis?: string;
  last_analyzed_at?: string;
}

export interface Decision {
  complaint_id: string;
  category: string;
  priority: PriorityType;
  department_id: string;
  action: string;
  status: StatusType;
  reviewer_note: string;
  decided_at: string;
  override_reason?: string;
  reviewer?: string;
}

export interface IncidentGroup {
  group_id: string;
  title: string;
  category: string;
  lead_complaint_id: string;
  created_at: string;
  status: 'active' | 'resolved';
}

export interface IncidentMember {
  group_id: string;
  complaint_id: string;
  score: number;
  relationship_status: RelationshipStatus;
}

export interface Handoff {
  id: string;
  complaint_id: string;
  department_id: string;
  channel: 'email' | 'phone' | 'portal';
  message: string;
  status: HandoffStatus;
  follow_up_at: string;
  type: 'handoff' | 'escalation';
  escalation_level?: 'Level 1' | 'Level 2' | 'Level 3';
  escalation_reason?: string;
  created_at: string;
}

export interface InformationRequest {
  id: string;
  complaint_id: string;
  message: string;
  sender: string;
  recipient: string;
  deadline: string;
  status: 'Pending' | 'Responded' | 'Closed';
  created_at: string;
  replies?: InformationReply[];
}

export interface InformationReply {
  id: string;
  request_id: string;
  complaint_id: string;
  text: string;
  attachments?: ComplaintAttachment[];
  sender: string;
  created_at: string;
}

export interface ResolutionEvidence {
  id?: string;
  complaint_id: string;
  note?: string;
  notes?: string;
  action_taken?: string;
  work_order_ref?: string;
  officer_name: string;
  department_id: string;
  completed_at?: string;
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  photo_url?: string;
  photo_name?: string;
  status: 'submitted' | 'verified' | 'rejected' | 'disputed';
  stage?: 'department_reported_resolved' | 'verified_resolved' | 'rejected_further_action';
  verified_by?: string;
  verified_at?: string;
  verification_note?: string;
  rejection_reason?: string;
  evidence_reviewed?: string[];
  exception_documented?: boolean;
  exception_reason?: string;
  citizen_feedback?: 'confirmed' | 'disputed';
  citizen_dispute_reason?: string;
  verification_policy_applied?: boolean;
}

export interface AuditLogEntry {
  id: string;
  entity: 'complaint' | 'decision' | 'handoff' | 'incident_group' | 'resolution' | 'info_request' | 'intake';
  entity_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  note: string;
  created_at: string;
  actor: string;
}

export interface EscalationItem {
  id: string;
  complaintId: string;
  shortId: string;
  issue: string;
  level: 1 | 2 | 3;
  daysOpen: number;
  status: 'Escalated' | 'Pending';
  department: string;
}

export interface MergedComplaintView {
  complaint: Complaint;
  analysis: Analysis;
  decision?: Decision;
  currentStatus: StatusType;
  currentPriority: PriorityType;
  currentDepartmentId: string;
  currentCategory: string;
  isOverridden: boolean;
  needsHumanReview: boolean;
  incidentGroupId?: string;
  incidentScore?: number;
  incidentRelationship?: RelationshipStatus;
  handoffs: Handoff[];
  attachments?: ComplaintAttachment[];
  infoRequests?: InformationRequest[];
  resolutionEvidence?: ResolutionEvidence;
}

export type AppLanguage = 'en' | 'hi' | 'ta';

export type SpeechSpeed = 'slow' | 'normal' | 'fast';

export interface AccessibilitySettings {
  language: AppLanguage;
  voiceInput: boolean;
  voiceOutput: boolean;
  autoRead: boolean;
  speechSpeed: SpeechSpeed;
  hasConfiguredPreferences: boolean;
}

export type TabType =
  | 'overview'
  | 'complaints'
  | 'map'
  | 'incidents'
  | 'departments'
  | 'intake'
  | 'analytics'
  | 'escalations'
  | 'history'
  | 'landing'
  | 'settings';