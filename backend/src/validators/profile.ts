import { z } from "zod";

export const updateProfileSchema = z.object({
  name:               z.string().min(1).max(200).optional(),
  photo_url:          z.string().url().optional().nullable(),
  institution:        z.string().max(200).optional().nullable(),
  role:               z.string().max(100).optional().nullable(),
  career_stage:       z.string().max(100).optional().nullable(),
  bio:                z.string().max(2000).optional().nullable(),
  linkedin_url:       z.string().url().optional().nullable(),
  google_scholar_url: z.string().url().optional().nullable(),
  research_area:      z.string().max(200).optional().nullable(),
  research_keywords:  z.array(z.string().max(100)).max(30).optional(),
  abstract_summary:   z.string().max(2000).optional().nullable(),
  goals:              z.array(z.string().max(500)).max(10).optional(),
  session_interests:  z.array(z.string().max(200)).max(20).optional(),
  availability:       z.record(z.unknown()).optional().nullable(),
  company_name:       z.string().max(200).optional().nullable(),
  company_stage:      z.string().max(100).optional().nullable(),
  company_description: z.string().max(1000).optional().nullable(),
  onboarding_complete: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
