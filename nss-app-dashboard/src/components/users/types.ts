/**
 * User Management Types
 */

export interface Volunteer {
  id: string
  first_name: string
  last_name: string
  email: string
  roll_number: string
  branch: string
  year: number
  phone_no?: string
  address?: string
  gender?: string
  nss_join_year?: number
  is_active: boolean
  avatar?: string
  profile_pic?: string | null
  eventsParticipated?: number
  totalHours?: number
  joinDate?: string
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  admins: number
}
