import { z } from "zod";

export const HandoffStatusEnum = z.enum(["Prepared", "Initiated", "Acknowledged"]);
export type HandoffStatus = z.infer<typeof HandoffStatusEnum>;

export const HandoffChannelEnum = z.enum(["email", "phone"]);
export type HandoffChannel = z.infer<typeof HandoffChannelEnum>;

export const HandoffSchema = z.object({
  id: z.string().min(1),
  complaint_id: z.string().min(1),
  department_id: z.string().min(1),
  channel: HandoffChannelEnum.default("email"),
  message_draft: z.string().min(1),
  status: HandoffStatusEnum.default("Prepared"),
  follow_up_date: z.string().optional(),
  created_at: z.string().datetime().optional().default(() => new Date().toISOString()),
});
export type Handoff = z.infer<typeof HandoffSchema>;

export const EscalationSchema = z.object({
  complaint_id: z.string().min(1),
  level: z.number().int().min(1).max(3).default(1),
  reason: z.string().min(3),
  follow_up_date: z.string().min(1),
  created_at: z.string().datetime().optional().default(() => new Date().toISOString()),
});
export type Escalation = z.infer<typeof EscalationSchema>;

export const AuditLogEntrySchema = z.object({
  id: z.number().int().optional(),
  entity_name: z.string().min(1),
  entity_id: z.string().min(1),
  action: z.string().min(1),
  before_state: z.record(z.any()).nullable().optional(),
  after_state: z.record(z.any()).nullable().optional(),
  reviewer: z.string().default("Prototype Reviewer"),
  actor: z.string().optional(),
  created_at: z.string().datetime().optional().default(() => new Date().toISOString()),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
