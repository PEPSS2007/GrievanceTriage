import taxonomyData from "../data/taxonomy.json";
import { ComplaintPriority, PriorityEvidenceItem } from "../contracts";

export interface PriorityRuleEvaluation {
  evidence: PriorityEvidenceItem[];
  forcedPriority: ComplaintPriority | null;
  priorityScore: number;
}

const PRIORITY_ORDER: Record<ComplaintPriority, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Urgent: 4,
};

export function evaluatePriorityRules(text: string): PriorityRuleEvaluation {
  const normalized = text.toLowerCase();
  const evidence: PriorityEvidenceItem[] = [];
  let maxPriorityScore = 1;
  let forcedPriority: ComplaintPriority | null = null;

  for (const rule of taxonomyData.priority_rules) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        evidence.push({
          rule_name: rule.name,
          matched_phrase: keyword,
          weight: rule.weight,
        });

        const targetPriority = rule.forced_priority as ComplaintPriority;
        const targetScore = PRIORITY_ORDER[targetPriority] || 1;

        if (targetScore > maxPriorityScore) {
          maxPriorityScore = targetScore;
          forcedPriority = targetPriority;
        }
        break; // Match rule once per keyword hit
      }
    }
  }

  return {
    evidence,
    forcedPriority,
    priorityScore: maxPriorityScore,
  };
}
