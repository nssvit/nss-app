/**
 * Role Management Types
 */

export interface Role {
  id: string
  role_name: string
  display_name: string
  description: string | null
  permissions: Record<string, unknown>
  hierarchy_level: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface UserRoleWithDetails {
  id: string
  volunteer_id: string
  role_definition_id: string
  assigned_at: string
  assigned_by?: string
  expires_at?: string | null
  is_active: boolean
  volunteer?: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile_pic?: string | null
  }
  role_definition?: Role
}

export interface VolunteerBasic {
  id: string
  first_name: string
  last_name: string
  email: string
  profile_pic: string | null
}

export type RoleTab = 'definitions' | 'assignments'

export interface RoleStats {
  totalRoles: number
  activeRoles: number
  totalAssignments: number
  admins: number
}
