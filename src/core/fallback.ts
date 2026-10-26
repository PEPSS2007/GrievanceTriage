import taxonomyData from "../data/taxonomy.json";
import { Analysis, ComplaintPriority } from "../contracts";
import { evaluatePriorityRules } from "./rules";

export function runDeterministicFallback(
  complaintId: string,
  text: string,
  location: string,
  redactedPiiCount: number,
  suspiciousTextDetected: boolean
): Analysis {
  const normalized = text.toLowerCase();
  const ruleEval = evaluatePriorityRules(normalized);

  // Score each category based on taxonomy keywords
  let bestCategory = taxonomyData.categories[0].name;
  let bestScore = -1;
  let bestDeptId = taxonomyData.categories[0].department_id;

  for (const cat of taxonomyData.categories) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat.name;
      bestDeptId = cat.department_id;
    }
  }

  // Determine priority: rule-based priority takes precedence, else based on score/severity
  let priority: ComplaintPriority = ruleEval.forcedPriority || "Medium";
  if (!ruleEval.forcedPriority && bestScore <= 0) {
    priority = "Low";
  }

  const uncertainties: string[] = [];
  let confidence = 0.82;

  if (bestScore <= 0) {
    uncertainties.push("No explicit category keywords detected; assigned default category.");
    confidence = 0.50;
  }
  if (suspiciousTextDetected) {
    uncertainties.push("Suspicious instruction text detected; evaluated via deterministic fallback safety.");
    confidence = Math.min(confidence, 0.70);
  }
  if (text.length < 25) {
    uncertainties.push("Short complaint description lacks complete context.");
    confidence = Math.min(confidence, 0.60);
  }

  const actionMap: Record<ComplaintPriority, string> = {
    Urgent: "Immediate safety dispatch required within 2 hours.",
    High: "Schedule priority field inspection within 24 hours.",
    Medium: "Assign to department queue under standard SLA.",
    Low: "Queue for routine ward maintenance route.",
  };

  const summary = `Grievance concerning ${bestCategory.toLowerCase()} reported at ${location}. Details: ${text.slice(0, 100).trim()}${text.length > 100 ? "..." : ""}`;

  return {
    complaint_id: complaintId,
    summary,
    category: bestCategory,
    priority,
    priority_evidence: ruleEval.evidence.length > 0 ? ruleEval.evidence : [{ rule_name: "municipal_keyword_match", matched_phrase: bestCategory, weight: 1.0 }],
    recommended_department_id: bestDeptId,
    suggested_action: actionMap[priority],
    uncertainties,
    needs_human_review: ruleEval.forcedPriority === "Urgent" || confidence < 0.70 || suspiciousTextDetected,
    redacted_pii_count: redactedPiiCount,
    suspicious_text_detected: suspiciousTextDetected,
    method: "fallback",
    confidence,
    created_at: new Date().toISOString(),
  };
}
