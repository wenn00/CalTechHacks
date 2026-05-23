import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  careerStage: z.enum([
    "UNDERGRADUATE",
    "GRADUATE_STUDENT",
    "POSTDOC",
    "EARLY_CAREER_RESEARCHER",
    "MID_CAREER_RESEARCHER",
    "SENIOR_RESEARCHER",
    "PROFESSOR",
    "INDUSTRY_PROFESSIONAL",
    "FOUNDER",
    "INVESTOR",
    "OTHER",
  ]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
