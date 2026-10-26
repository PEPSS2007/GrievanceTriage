/**
 * GrievanceTriage - PII Sanitization Engine
 * Redacts obvious phone numbers, email addresses, and national IDs
 */

export interface PIISanitizeResult {
  sanitizedText: string;
  redactedCount: number;
}

export function redactPII(text: string): PIISanitizeResult {
  let count = 0;

  // 1. Redact Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const withoutEmails = text.replace(emailRegex, () => {
    count++;
    return "[REDACTED_EMAIL]";
  });

  // 2. Redact Phone numbers (North American & international styles e.g. +1-555-..., 555-123-4567, (555) 123-4567)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const withoutPhones = withoutEmails.replace(phoneRegex, () => {
    count++;
    return "[REDACTED_PHONE]";
  });

  // 3. Redact Social Security / National ID formats (XXX-XX-XXXX)
  const idRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  const withoutIds = withoutPhones.replace(idRegex, () => {
    count++;
    return "[REDACTED_ID]";
  });

  return {
    sanitizedText: withoutIds,
    redactedCount: count,
  };
}
