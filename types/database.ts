export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string | null
          name: string
          email: string
          photo_url: string | null
          institution: string | null
          role: string | null
          career_stage: string | null
          bio: string | null
          linkedin_url: string | null
          google_scholar_url: string | null
          research_area: string | null
          research_keywords: string[] | null
          abstract_summary: string | null
          goals: string[] | null
          session_interests: string[] | null
          availability: Json | null
          company_name: string | null
          company_stage: string | null
          company_description: string | null
          match_score_cache: Json | null
          onboarding_complete: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          name: string
          email: string
          photo_url?: string | null
          institution?: string | null
          role?: string | null
          career_stage?: string | null
          bio?: string | null
          linkedin_url?: string | null
          google_scholar_url?: string | null
          research_area?: string | null
          research_keywords?: string[] | null
          abstract_summary?: string | null
          goals?: string[] | null
          session_interests?: string[] | null
          availability?: Json | null
          company_name?: string | null
          company_stage?: string | null
          company_description?: string | null
          match_score_cache?: Json | null
          onboarding_complete?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          name?: string
          email?: string
          photo_url?: string | null
          institution?: string | null
          role?: string | null
          career_stage?: string | null
          bio?: string | null
          linkedin_url?: string | null
          google_scholar_url?: string | null
          research_area?: string | null
          research_keywords?: string[] | null
          abstract_summary?: string | null
          goals?: string[] | null
          session_interests?: string[] | null
          availability?: Json | null
          company_name?: string | null
          company_stage?: string | null
          company_description?: string | null
          match_score_cache?: Json | null
          onboarding_complete?: boolean | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
