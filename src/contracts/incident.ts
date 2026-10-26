import { z } from "zod";

export const IncidentMemberStatusEnum = z.enum(["suggested", "confirmed", "rejected"]);
export type IncidentMemberStatus = z.infer<typeof IncidentMemberStatusEnum>;

export const IncidentGroupSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3),
  category: z.string().min(1),
  created_at: z.string().datetime().optional().default(() => new Date().toISOString()),
});
export type IncidentGroup = z.infer<typeof IncidentGroupSchema>;

export const IncidentMemberSchema = z.object({
  group_id: z.string().min(1),
  complaint_id: z.string().min(1),
  similarity_score: z.number().min(0).max(1),
  reasons: z.array(z.string()).default([]),
  membership_status: IncidentMemberStatusEnum.default("suggested"),
});
export type IncidentMember = z.infer<typeof IncidentMemberSchema>;

export const RelatedComplaintCandidateSchema = z.object({
  complaint_id: z.string(),
  candidate_id: z.string(),
  similarity_score: z.number().min(0).max(1),
  relationship: z.enum(["likely_related", "possibly_related", "unrelated"]),
  reasons: z.array(z.string()),
});
export type RelatedComplaintCandidate = z.infer<typeof RelatedComplaintCandidateSchema>;
