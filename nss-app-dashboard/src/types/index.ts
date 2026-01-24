/**
 * Application Types
 *
 * This module re-exports types from Drizzle schema and provides
 * extended types for application use.
 *
 * Drizzle schema is the single source of truth for database types.
 */

// Re-export all Drizzle types from schema
export type {
  Volunteer,
  NewVolunteer,
  Event,
  NewEvent,
  EventParticipation,
  NewEventParticipation,
  EventCategory,
  NewEventCategory,
  RoleDefinition,
  NewRoleDefinition,
  UserRole,
  NewUserRole,
} from '@/db/schema'

// Re-export validation types
export type {
  InsertVolunteer,
  UpdateVolunteer,
  SelectVolunteer,
  InsertEvent,
  UpdateEvent,
  SelectEvent,
  InsertEventParticipation,
  UpdateEventParticipation,
  SelectEventParticipation,
  InsertEventCategory,
  UpdateEventCategory,
  SelectEventCategory,
  InsertRoleDefinition,
  UpdateRoleDefinition,
  SelectRoleDefinition,
  InsertUserRole,
  UpdateUserRole,
  SelectUserRole,
  ApproveHoursInput,
  BulkApproveHoursInput,
  RejectHoursInput,
  EventRegistrationInput,
  PaginationInput,
  SearchInput,
} from '@/db/validations'

// ============================================================================
// Extended Types (with computed/joined fields)
// ============================================================================

import type {
  Volunteer,
  Event,
  EventCategory,
  EventParticipation,
  RoleDefinition,
} from '@/db/schema'

/**
 * Volunteer with computed statistics
 * Extends Drizzle Volunteer type with stats and snake_case aliases for compatibility
 */
export interface VolunteerWithStats extends Volunteer {
  // Stats
  eventsParticipated?: number
  totalHours?: number
  approvedHours?: number
  joinDate?: string
  // Snake_case aliases for compatibility
  first_name?: string
  last_name?: string
  roll_number?: string
  phone_no?: string | null
  birth_date?: string | null
  nss_join_year?: number | null
  profile_pic?: string | null
  is_active?: boolean | null
  auth_user_id?: string | null
  avatar?: string | null // alias for profilePic
}

/**
 * Event with category and statistics
 */
export interface EventWithStats extends Event {
  category?: EventCategory | null
  categoryName?: string | null
  categoryColor?: string | null
  participantCount?: number
  totalHours?: number
}

/**
 * Event with full details including participants
 */
export interface EventWithDetails extends Event {
  category: EventCategory | null
  createdBy: Volunteer | null
  participants: EventParticipationWithVolunteer[]
}

/**
 * Event participation with volunteer details
 */
export interface EventParticipationWithVolunteer extends EventParticipation {
  volunteer?: Volunteer
  volunteerName?: string
}

/**
 * Event participation with event details
 */
export interface EventParticipationWithEvent extends EventParticipation {
  event?: Event
  eventName?: string
  categoryName?: string
}

/**
 * User role with role definition
 */
export interface UserRoleWithDefinition {
  id: string
  volunteerId: string
  roleDefinitionId: string
  assignedBy: string | null
  assignedAt: Date
  expiresAt: Date | null
  isActive: boolean | null
  roleDefinition: RoleDefinition
}

/**
 * Current user context with roles and permissions
 * Note: Uses snake_case to match Supabase/AuthContext format
 */
export interface CurrentUser {
  // Primary snake_case properties (from AuthContext)
  volunteer_id: string
  first_name: string
  last_name: string
  email: string
  roll_number: string
  branch: string
  year: string | number
  phone_no: string | null
  birth_date: string | null
  gender: string | null
  nss_join_year: number | null
  address: string | null
  profile_pic: string | null
  is_active: boolean
  roles: string[]
  permissions?: Record<string, string[]>
  // Aliases for camelCase access (backwards compatibility)
  volunteerId?: string
  firstName?: string
  lastName?: string
  rollNumber?: string
  phoneNo?: string | null
  birthDate?: string | null
  nssJoinYear?: number | null
  profilePic?: string | null
  isActive?: boolean
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  // Primary camelCase (Drizzle)
  totalEvents: number
  activeVolunteers: number
  totalHours: number
  ongoingProjects: number
  // Snake_case aliases
  total_events?: number
  active_volunteers?: number
  total_hours?: number
  ongoing_projects?: number
}

/**
 * Monthly activity trend data point
 */
export interface ActivityTrend {
  month: string
  monthNumber: number
  yearNumber: number
  eventsCount: number
  volunteersCount: number
  hoursSum: number
  // Snake_case aliases
  month_number?: number
  year_number?: number
  events_count?: number
  volunteers_count?: number
  hours_sum?: number
}
export type MonthlyActivityTrend = ActivityTrend

/**
 * Category distribution for reports
 */
export interface CategoryDistribution {
  // Primary camelCase
  categoryId: number
  categoryName: string
  eventCount: number
  colorHex: string
  participantCount: number
  totalHours: number
  // Snake_case aliases
  category_id?: number
  category_name?: string
  event_count?: number
  color_hex?: string
  participant_count?: number
  total_hours?: number
}

/**
 * Top event for reports
 */
export interface TopEvent {
  eventId: string
  eventName: string
  eventDate: string | null
  categoryName: string
  participantCount: number
  totalHours: number
  impactScore: string
  // Snake_case aliases
  event_id?: string
  event_name?: string
  event_date?: string | null
  category_name?: string
  participant_count?: number
  total_hours?: number
  impact_score?: string
}

/**
 * Event impact metrics
 */
export interface EventImpact {
  // Primary camelCase
  eventId: string
  eventName: string
  eventDate: string | null
  categoryName: string
  participantCount: number
  totalHours: number
  impactScore: string
  eventStatus: string
  // Snake_case aliases
  event_id?: string
  event_name?: string
  event_date?: string | null
  category_name?: string
  participant_count?: number
  total_hours?: number
  impact_score?: string
  event_status?: string
}

/**
 * Volunteer hours summary for reports
 */
export interface VolunteerHoursSummary {
  volunteer_id: string
  volunteer_name: string
  total_hours: number
  approved_hours: number
  events_count: number
  last_activity: Date | null
}

/**
 * Attendance summary for events
 */
export interface AttendanceSummary {
  event_id: string
  event_name: string
  event_date: Date | null
  category_name: string | null
  total_registered: number
  total_present: number
  total_absent: number
  attendance_rate: number
  total_hours: number
}

/**
 * User statistics
 */
export interface UserStats {
  total_users: number
  active_users: number
  pending_users: number
  admin_count: number
}
