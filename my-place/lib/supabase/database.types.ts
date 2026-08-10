// This file will be auto-generated once Supabase project is set up
// Run: npm run db:types
// Placeholder for now

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
      // Will be generated from Supabase schema
    }
    Views: {
      // Will be generated from Supabase schema
    }
    Functions: {
      // Will be generated from Supabase schema
    }
    Enums: {
      // Will be generated from Supabase schema
    }
  }
}
