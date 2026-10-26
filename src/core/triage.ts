import { Analysis, Complaint, ComplaintPriority } from "../contracts";
import { redactPII } from "./pii";
import { checkSuspiciousInstructions } from "./guardrails";
import { evaluatePriorityRules } from "./rules";
import { runDeterministicFallback } from "./fallback";
import { getLLMProvider } from "./llm";
import { getDatabase } from "../lib/db";

export interface TriageInput {
  complaintId: string;
  text: string;
  location: string;
  ward?: string;
  lat?: number;
  lng?: number;
  source?: string;
  forceFallback?: boolean;
  is_demo?: boolean;
  reporting_person?: { name?: string; contact?: string };
  source_reference?: string;
  receiving_officer?: string;
  officer_notes?: string;
  attachments?: any[];
  created_at?: string;
}

export interface TriageResult {
  complaint: Complaint;
  analysis: Analysis;
  method: "ai" | "fallback";
}

const PRIORITY_LEVELS: Record<ComplaintPriority, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Urgent: 4,
};

export async function triageComplaint(input: TriageInput): Promise<TriageResult> {
  const db = getDatabase();

  // 1. Redact obvious PII
  const { sanitizedText, redactedCount } = redactPII(input.text);

  // 2. Check for suspicious instruction-like text
  const guardrailCheck = checkSuspiciousInstructions(input.text);

  // 3. Evaluate deterministic priority rules
  const ruleEval = evaluatePriorityRules(sanitizedText);

  let analysis: Analysis;
  let method: "ai" | "fallback" = "ai";

  // If forced fallback or suspicious injection detected, bypass live LLM call for safety
  if (input.forceFallback || guardrailCheck.suspicious) {
    analysis = runDeterministicFallback(
      input.complaintId,
      sanitizedText,
      input.location,
      redactedCount,
      guardrailCheck.suspicious
    );
    method = "fallback";
  } else {
    try {
      const provider = getLLMProvider();
      const llmOutput = await provider.generateTriage(sanitizedText, input.location);

      // Harmonize priority: if deterministic safety rules flagged Urgent, do not let LLM downgrade without safety review
      let finalPriority = llmOutput.priority;
      let needsReview = false;

      if (ruleEval.forcedPriority) {
        const ruleLevel = PRIORITY_LEVELS[ruleEval.forcedPriority];
        const llmLevel = PRIORITY_LEVELS[finalPriority];
        if (ruleLevel > llmLevel) {
          finalPriority = ruleEval.forcedPriority;
          needsReview = true;
        }
      }

      if (finalPriority === "Urgent" || llmOutput.confidence < 0.75) {
        needsReview = true;
      }

      analysis = {
        complaint_id: input.complaintId,
        summary: llmOutput.summary,
        category: llmOutput.category,
        priority: finalPriority,
        priority_evidence: ruleEval.evidence.length > 0 ? ruleEval.evidence : [{ rule_name: "category_priority_criteria", matched_phrase: llmOutput.category, weight: 1.0 }],
        recommended_department_id: llmOutput.recommended_department_id,
        suggested_action: llmOutput.suggested_action,
        uncertainties: llmOutput.uncertainties,
        needs_human_review: needsReview,
        redacted_pii_count: redactedCount,
        suspicious_text_detected: false,
        method: "ai",
        confidence: llmOutput.confidence,
        created_at: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("LLM triage failed or unavailable, engaging deterministic fallback:", err);
      analysis = runDeterministicFallback(
        input.complaintId,
        sanitizedText,
        input.location,
        redactedCount,
        guardrailCheck.suspicious
      );
      method = "fallback";
    }
  }

  const complaint: Complaint = {
    id: input.complaintId,
    text: input.text,
    location: input.location,
    ward: input.ward,
    lat: input.lat,
    lng: input.lng,
    source: input.source || "Web Portal",
    created_at: input.created_at || new Date().toISOString(),
    is_demo: input.is_demo ?? false,
    reporting_person: input.reporting_person,
    source_reference: input.source_reference,
    receiving_officer: input.receiving_officer,
    officer_notes: input.officer_notes,
    attachments: input.attachments,
  };

  await db.createComplaint(complaint);
  await db.saveAnalysis(analysis);

  // Initial pending decision
  await db.saveDecision({
    complaint_id: complaint.id,
    approved_category: analysis.category,
    approved_priority: analysis.priority,
    approved_department_id: analysis.recommended_department_id,
    status: analysis.needs_human_review ? "Needs More Information" : "Pending Review",
    decided_at: new Date().toISOString(),
  });

  return { complaint, analysis, method };
}
