import { z } from "zod";

export const WardContactSchema = z.object({
  ward: z.string(),
  zone: z.string(),
  officer_name: z.string(),
  role: z.string(),
  phone: z.string(),
  email: z.string().email("Invalid email format"),
  jurisdiction: z.string(),
  verification_status: z.enum(["verified", "unverified", "pending"]),
  last_verified: z.string(),
  source: z.string(),
});

export type WardContact = z.infer<typeof WardContactSchema>;

export const DepartmentSchema = z.object({
  id: z.string().min(1, "Department ID is required"),
  name: z.string().min(1, "Department name is required"),
  categories: z.array(z.string()).min(1, "At least one category required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(5, "Valid phone number required"),
  website: z.string().url().optional().or(z.literal("")),
  portal: z.string().url().optional().or(z.literal("")),
  escalation_contact: z.string().min(1, "Escalation contact required"),
  is_demo: z.boolean().default(true),
  ward_contacts: z.record(z.string(), WardContactSchema).optional(),
});

export type Department = z.infer<typeof DepartmentSchema>;
