import taxonomyData from "../data/taxonomy.json";
import { ComplaintStatus } from "../contracts";

export interface TransitionValidationResult {
  allowed: boolean;
  message?: string;
}

export function validateStatusTransition(
  currentStatus: ComplaintStatus,
  targetStatus: ComplaintStatus
): TransitionValidationResult {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const allowedTransitions = (taxonomyData.status_lifecycle.allowed_transitions as Record<string, string[]>)[currentStatus];

  if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
    return {
      allowed: false,
      message: `Invalid state transition from "${currentStatus}" to "${targetStatus}". Allowed next states: [${(allowedTransitions || []).join(", ")}]`,
    };
  }

  return { allowed: true };
}
