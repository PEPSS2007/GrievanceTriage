import { z } from "zod";
import { ComplaintPriorityEnum, ComplaintStatusEnum } from "./complaint";

export const ReviewDecisionSchema = z.object({
  complaint_id: z.string().min(1, "Complaint ID is required"),
  approved_category: z.string().min(1, "Approved category is required"),
  approved_priority: ComplaintPriorityEnum,
  approved_department_id: z.string().min(1, "Approved department is required"),
  status: ComplaintStatusEnum.default("Approved"),
  reviewer_note: z.string().optional(),
  override_reason: z.string().optional(),
  decided_at: z.string().datetime().optional().default(() => new Date().toISOString()),
});

export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;
