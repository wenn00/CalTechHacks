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
          full_name: string | null
          affiliation: string | null
          role: string | null
          research_area: string | null
          goals: string[] | null
          onboarding_complete: boolean | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          affiliation?: string | null
          role?: string | null
          research_area?: string | null
          goals?: string[] | null
          onboarding_complete?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          affiliation?: string | null
          role?: string | null
          research_area?: string | null
          goals?: string[] | null
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
