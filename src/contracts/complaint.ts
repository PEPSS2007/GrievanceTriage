import { z } from "zod";

export const ComplaintPriorityEnum = z.enum(["Low", "Medium", "High", "Urgent"]);
export type ComplaintPriority = z.infer<typeof ComplaintPriorityEnum>;

export const ComplaintStatusEnum = z.enum([
  "Submitted",
  "Under Review",
  "Pending Review",
  "Assigned",
  "In Progress",
  "Needs More Information",
  "Contact Prepared",
  "Contact Initiated",
  "Acknowledged",
  "Resolution Submitted",
  "Verification Pending",
  "Verified Resolved",
  "Rejected — Further Action Required",
  "Resolved",
  "Rejected",
  "Reopened",
  "Escalated",
  "Open",
  "Open / Under Review",
  "Approved",
]);
export type ComplaintStatus = z.infer<typeof ComplaintStatusEnum>;

export const ComplaintSchema = z.object({
  id: z.string().min(1, "Complaint ID is required"),
  text: z.string().min(3, "Complaint text must have at least 3 characters"),
  location: z.string().min(1, "Location is required"),
  ward: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  source: z.string().default("Web Portal"),
  attachments: z.array(z.any()).optional(),
  created_at: z.string().datetime().optional().default(() => new Date().toISOString()),
  is_demo: z.boolean().optional().default(false),
  reporting_person: z
    .object({
      name: z.string().optional(),
      contact: z.string().optional(),
    })
    .optional(),
  source_reference: z.string().optional(),
  receiving_officer: z.string().optional(),
  officer_notes: z.string().optional(),
});

export type Complaint = z.infer<typeof ComplaintSchema>;
