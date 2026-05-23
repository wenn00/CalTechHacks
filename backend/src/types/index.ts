import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;    // profiles.id (Supabase Auth UUID)
    email: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttendeeQueryParams {
  q?: string;
  research_area?: string;
  institution?: string;
  career_stage?: string;
  role?: string;
  page?: number;
  limit?: number;
}
