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
          branch: 'EXCS' | 'CMPN' | 'IT' | 'BIO-MED' | 'EXTC'
          year: 'FE' | 'SE' | 'TE'
          phone_no: string | null
          birth_date: string | null
          gender: 'M' | 'F' | 'Prefer not to say' | null
          nss_join_year: number | null
          address: string | null
          profile_pic: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          first_name: string
          last_name: string
          roll_number: string
          email: string
          branch: 'EXCS' | 'CMPN' | 'IT' | 'BIO-MED' | 'EXTC'
          year: 'FE' | 'SE' | 'TE'
          phone_no?: string | null
          birth_date?: string | null
          gender?: 'M' | 'F' | 'Prefer not to say' | null
          nss_join_year?: number | null
          address?: string | null
          profile_pic?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          first_name?: string
          last_name?: string
          roll_number?: string
          email?: string
          branch?: 'EXCS' | 'CMPN' | 'IT' | 'BIO-MED' | 'EXTC'
          year?: 'FE' | 'SE' | 'TE'
          phone_no?: string | null
          birth_date?: string | null
          gender?: 'M' | 'F' | 'Prefer not to say' | null
          nss_join_year?: number | null
          address?: string | null
          profile_pic?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      role_definitions: {
        Row: {
          id: string
          role_name: string
          display_name: string
          description: string | null
          permissions: Record<string, any>
          hierarchy_level: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          role_name: string
          display_name: string
          description?: string | null
          permissions?: Record<string, any>
          hierarchy_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role_name?: string
          display_name?: string
          description?: string | null
          permissions?: Record<string, any>
          hierarchy_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          volunteer_id: string
          role_definition_id: string
          assigned_by: string | null
          assigned_at: string
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          volunteer_id: string
          role_definition_id: string
          assigned_by?: string | null
          assigned_at?: string
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          volunteer_id?: string
          role_definition_id?: string
          assigned_by?: string | null
          assigned_at?: string
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_categories: {
        Row: {
          id: string
          category_name: string
          display_name: string
          description: string | null
          color_hex: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_name: string
          display_name: string
          description?: string | null
          color_hex?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_name?: string
          display_name?: string
          description?: string | null
          color_hex?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          event_name: string
          description: string | null
          start_date: string
          end_date: string | null
          location: string | null
          max_participants: number | null
          min_participants: number | null
          registration_deadline: string | null
          event_status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
          category_id: string | null
          created_by_volunteer_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_name: string
          description?: string | null
          start_date: string
          end_date?: string | null
          location?: string | null
          max_participants?: number | null
          min_participants?: number | null
          registration_deadline?: string | null
          event_status?: 'planned' | 'ongoing' | 'completed' | 'cancelled'
          category_id?: string | null
          created_by_volunteer_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_name?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          location?: string | null
          max_participants?: number | null
          min_participants?: number | null
          registration_deadline?: string | null
          event_status?: 'planned' | 'ongoing' | 'completed' | 'cancelled'
          category_id?: string | null
          created_by_volunteer_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_participation: {
        Row: {
          id: string
          volunteer_id: string
          event_id: string
          participation_status: 'registered' | 'attended' | 'absent' | 'partial'
          hours_attended: number | null
          feedback: string | null
          rating: number | null
          certificate_issued: boolean
          certificate_url: string | null
          registration_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          volunteer_id: string
          event_id: string
          participation_status?: 'registered' | 'attended' | 'absent' | 'partial'
          hours_attended?: number | null
          feedback?: string | null
          rating?: number | null
          certificate_issued?: boolean
          certificate_url?: string | null
          registration_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          volunteer_id?: string
          event_id?: string
          participation_status?: 'registered' | 'attended' | 'absent' | 'partial'
          hours_attended?: number | null
          feedback?: string | null
          rating?: number | null
          certificate_issued?: boolean
          certificate_url?: string | null
          registration_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { p_role_name: string }
        Returns: boolean
      }
      has_any_role: {
        Args: { p_role_names: string[] }
        Returns: boolean
      }
      get_current_volunteer: {
        Args: Record<PropertyKey, never>
        Returns: {
          volunteer_id: string
          first_name: string
          last_name: string
          email: string
          roll_number: string
          roles: string[]
          permissions: Record<string, any>
        }[]
      }
      can_register_for_event: {
        Args: { p_event_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]