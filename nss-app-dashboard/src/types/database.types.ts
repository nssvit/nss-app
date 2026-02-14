/**
 * Database Types
 *
 * This file provides type definitions for Supabase database operations.
 * For full type safety, generate this file using:
 * npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/database.types.ts
 *
 * For now, we use a minimal Database type that allows any table access.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      volunteers: {
        Row: {
          id: string
          auth_user_id: string | null
          first_name: string
          last_name: string
          roll_number: string
          email: string
          branch: string | null
          year: number | null
          phone_no: string | null
          birth_date: string | null
          gender: string | null
          nss_join_year: number | null
          address: string | null
          profile_pic: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['volunteers']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['volunteers']['Insert']>
      }
      events: {
        Row: {
          id: string
          event_name: string
          description: string | null
          start_date: string
          end_date: string
          event_date: string | null
          declared_hours: number
          category_id: number | null
          min_participants: number | null
          max_participants: number | null
          event_status: string
          location: string | null
          registration_deadline: string | null
          created_by_volunteer_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['events']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      event_participation: {
        Row: {
          id: string
          event_id: string
          volunteer_id: string
          registration_date: string
          attendance_date: string | null
          participation_status: string
          hours_attended: number
          declared_hours: number
          approval_status: string
          approved_hours: number | null
          approved_by: string | null
          approved_at: string | null
          approval_notes: string | null
          notes: string | null
          recorded_by_volunteer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['event_participation']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['event_participation']['Insert']>
      }
      event_categories: {
        Row: {
          id: number
          category_name: string
          color_hex: string
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['event_categories']['Insert']>
      }
      role_definitions: {
        Row: {
          id: string
          role_name: string
          display_name: string
          description: string | null
          hierarchy_level: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['role_definitions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['role_definitions']['Insert']>
      }
      user_roles: {
        Row: {
          id: string
          volunteer_id: string
          role_definition_id: string
          assigned_by: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['user_roles']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>
      }
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      [key: string]: string
    }
    CompositeTypes: {
      [key: string]: unknown
    }
  }
}
