import { z } from "zod";
import { ComplaintPriorityEnum } from "./complaint";

export const PriorityEvidenceItemSchema = z.object({
  rule_name: z.string(),
  matched_phrase: z.string(),
  weight: z.number(),
});
export type PriorityEvidenceItem = z.infer<typeof PriorityEvidenceItemSchema>;

export const AnalysisMethodEnum = z.enum(["ai", "fallback"]);
export type AnalysisMethod = z.infer<typeof AnalysisMethodEnum>;

export const AnalysisSchema = z.object({
  complaint_id: z.string().min(1),
  summary: z.string().min(5, "Summary must be at least 5 characters"),
  category: z.string().min(1, "Category is required"),
  priority: ComplaintPriorityEnum,
  priority_evidence: z.array(PriorityEvidenceItemSchema).default([]),
  recommended_department_id: z.string().min(1, "Recommended department is required"),
  suggested_action: z.string().min(3, "Suggested action is required"),
  uncertainties: z.array(z.string()).default([]),
  needs_human_review: z.boolean().default(false),
  redacted_pii_count: z.number().int().nonnegative().default(0),
  suspicious_text_detected: z.boolean().default(false),
  method: AnalysisMethodEnum.default("ai"),
  confidence: z.number().min(0).max(1).default(0.85),
  created_at: z.string().datetime().optional().default(() => new Date().toISOString()),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

export const LLMAnalysisOutputSchema = z.object({
  summary: z.string().describe("Concise 1-2 sentence factual summary without inventing details"),
  category: z.string().describe("Assigned municipal grievance category"),
  priority: ComplaintPriorityEnum.describe("Priority level based on urgency and risk"),
  recommended_department_id: z.string().describe("Department ID responsible for this grievance"),
  suggested_action: z.string().describe("Immediate operational next step"),
  uncertainties: z.array(z.string()).describe("Any ambiguous, missing, or contradictory details"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
});

export type LLMAnalysisOutput = z.infer<typeof LLMAnalysisOutputSchema>;
