import { z } from "zod";

export const attendeeQuerySchema = z.object({
  q:             z.string().max(200).optional(),
  research_area: z.string().max(100).optional(),
  institution:   z.string().max(200).optional(),
  career_stage:  z.string().max(100).optional(),
  role:          z.string().max(100).optional(),
  page:          z.coerce.number().int().min(1).default(1),
  limit:         z.coerce.number().int().min(1).max(50).default(20),
});

export type AttendeeQuery = z.infer<typeof attendeeQuerySchema>;
