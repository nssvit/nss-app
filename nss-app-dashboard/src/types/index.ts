import { Tables } from './database.types'

export type Volunteer = Tables<'volunteers'> & {
  eventsParticipated?: number
  totalHours?: number
  status?: 'Active' | 'Inactive' | 'Pending'
  joinDate?: string
  avatar?: string
}

export type Event = Tables<'events'> & {
  category?: Tables<'event_categories'>
  participantCount?: number
  capacity?: string
}

export type EventParticipation = Tables<'event_participation'> & {
  volunteer?: Tables<'volunteers'>
  event?: Tables<'events'>
}

export type Role = Tables<'role_definitions'>

export type UserRole = Tables<'user_roles'> & {
  volunteer?: Tables<'volunteers'>
  role_definition?: Tables<'role_definitions'>
}

export interface CurrentUser {
  volunteer_id: string
  first_name: string
  last_name: string
  email: string
  roll_number: string
  branch: string
  year: number
  phone_no: string
  birth_date: string
  gender: string
  nss_join_year: number
  address: string
  profile_pic: string | null
  is_active: boolean
  roles: string[]
  permissions?: Record<string, any>
}

export interface EventWithDetails extends Omit<Event, 'category'> {
  category: Tables<'event_categories'> | null
  created_by: Tables<'volunteers'> | null
  participants: EventParticipation[]
}