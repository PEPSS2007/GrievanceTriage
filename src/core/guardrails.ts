/**
 * GrievanceTriage - Guardrails & Prompt Injection Detection
 * Detects adversarial instruction-like text attempting to override triage rules
 */

export interface GuardrailCheckResult {
  suspicious: boolean;
  patterns: string[];
}

const INJECTION_PATTERNS = [
  /system\s+override/i,
  /ignore\s+(all\s+|previous\s+|safety\s+)?instructions/i,
  /ignore\s+guidelines/i,
  /admin\s+directive/i,
  /you\s+are\s+now\s+(an\s+|a\s+)?/i,
  /\[inst\]/i,
  /\[\/inst\]/i,
  /forget\s+your\s+(system\s+)?prompt/i,
  /output\s+only\s*[:{]/i,
  /drop\s+table/i,
  /delete\s+from/i,
  /bypass\s+(all\s+)?review/i,
  /disregard\s+(all\s+|safety\s+)?rules/i,
];

export function checkSuspiciousInstructions(text: string): GuardrailCheckResult {
  const matchedPatterns: string[] = [];

  for (const regex of INJECTION_PATTERNS) {
    if (regex.test(text)) {
      matchedPatterns.push(regex.source);
    }
  }

  return {
    suspicious: matchedPatterns.length > 0,
    patterns: matchedPatterns,
  };
}
