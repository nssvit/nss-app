/**
 * Shared row mapping functions
 *
 * Converts snake_case DB rows to camelCase frontend types.
 * Used by both server actions and page.tsx server components
 * to avoid duplicating mapping logic.
 */

import type { z } from 'zod'
import type {
  VolunteerWithStats,
  ActivityTrend,
  EventWithStats,
  EventParticipationWithEvent,
  CategoryDistribution,
  TopEvent,
  AttendanceSummary,
  VolunteerHoursSummary,
} from '@/types'
import type {
  volunteerWithStatsRowSchema,
  monthlyTrendRowSchema,
  eventWithStatsRowSchema,
  participationHistoryRowSchema,
  categoryDistributionRowSchema,
  topEventRowSchema,
  attendanceSummaryRowSchema,
  volunteerHoursSummaryRowSchema,
} from '@/db/query-validators'

type VolunteerRow = z.infer<typeof volunteerWithStatsRowSchema>
type TrendRow = z.infer<typeof monthlyTrendRowSchema>
type EventRow = z.infer<typeof eventWithStatsRowSchema>
type ParticipationRow = z.infer<typeof participationHistoryRowSchema>
type CategoryDistRow = z.infer<typeof categoryDistributionRowSchema>
type TopEventRow = z.infer<typeof topEventRowSchema>
type AttendanceSummaryRow = z.infer<typeof attendanceSummaryRowSchema>
type VolunteerHoursRow = z.infer<typeof volunteerHoursSummaryRowSchema>

// Coercion helpers: DB rows may return string or Date for temporal fields
function toDate(v: string | Date): Date {
  return v instanceof Date ? v : new Date(v)
}
function toDateOrNull(v: string | Date | null): Date | null {
  return v == null ? null : toDate(v)
}
function toStringOrNull(v: string | Date | null): string | null {
  if (v == null) return null
  return v instanceof Date ? v.toISOString() : v
}
function toBool(v: boolean | number): boolean {
  return typeof v === 'number' ? v !== 0 : v
}

export function mapVolunteerRow(r: VolunteerRow): VolunteerWithStats {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    rollNumber: r.roll_number,
    branch: r.branch,
    year: r.year,
    phoneNo: r.phone_no,
    birthDate: toStringOrNull(r.birth_date),
    gender: r.gender,
    nssJoinYear: r.nss_join_year,
    address: r.address,
    profilePic: r.profile_pic,
    isActive: toBool(r.is_active),
    authUserId: r.auth_user_id,
    createdAt: toDate(r.created_at),
    updatedAt: toDate(r.updated_at),
    eventsParticipated: r.events_participated ?? 0,
    totalHours: r.total_hours ?? 0,
    approvedHours: r.approved_hours ?? 0,
    roleName: r.role_name ?? null,
  }
}

export function mapTrendRow(r: TrendRow): ActivityTrend {
  return {
    month: r.month,
    monthNumber: r.month_number,
    yearNumber: r.year_number,
    eventsCount: r.events_count,
    volunteersCount: r.volunteers_count,
    hoursSum: r.hours_sum,
  }
}

export function mapEventRow(r: EventRow): EventWithStats {
  return {
    id: r.id,
    eventName: r.event_name,
    description: r.description,
    startDate: r.start_date,
    endDate: r.end_date,
    location: r.location,
    maxParticipants: r.max_participants,
    eventStatus: r.event_status,
    declaredHours: r.declared_hours ?? 0,
    categoryId: r.category_id,
    registrationDeadline: r.registration_deadline ?? null,
    minParticipants: r.min_participants ?? null,
    isActive: toBool(r.is_active ?? true),
    createdBy: r.created_by_volunteer_id ?? '',
    createdAt: toDate(r.created_at),
    updatedAt: toDate(r.updated_at),
    participantCount: r.participant_count ?? 0,
    totalHours: r.total_hours ?? 0,
    categoryName: r.category_name,
    categoryColor: r.category_color,
    userParticipationStatus: r.user_participation_status ?? null,
  }
}

export function mapParticipationRow(r: ParticipationRow, volunteerId: string): EventParticipationWithEvent {
  return {
    id: r.participation_id ?? r.event_id,
    eventId: r.event_id,
    volunteerId,
    participationStatus: r.participation_status,
    hoursAttended: r.hours_attended ?? 0,
    approvalStatus: r.approval_status ?? 'pending',
    approvedBy: r.approved_by ?? null,
    approvedAt: toDateOrNull(r.approved_at ?? null),
    approvedHours: r.approved_hours ?? null,
    notes: r.notes ?? null,
    approvalNotes: r.approval_notes ?? null,
    attendanceDate: toDateOrNull(r.attendance_date ?? null),
    recordedByVolunteerId: r.recorded_by_volunteer_id ?? null,
    createdAt: r.created_at ? toDate(r.created_at) : undefined,
    registeredAt: toDate(r.registration_date ?? r.attendance_date ?? new Date()),
    updatedAt: toDate(r.attendance_date ?? new Date()),
    eventName: r.event_name,
    startDate: r.start_date ?? null,
    categoryName: r.category_name ?? undefined,
  }
}

export function mapCategoryDistributionRow(r: CategoryDistRow): CategoryDistribution {
  return {
    categoryId: r.category_id,
    categoryName: r.category_name,
    eventCount: r.event_count,
    colorHex: r.color_hex ?? '#6b7280',
    participantCount: r.participant_count,
    totalHours: r.total_hours,
  }
}

export function mapTopEventRow(r: TopEventRow): TopEvent {
  return {
    eventId: r.event_id,
    eventName: r.event_name,
    startDate: toStringOrNull(r.start_date),
    categoryName: r.category_name,
    participantCount: r.participant_count,
    totalHours: r.total_hours,
    impactScore: r.impact_score,
    eventStatus: r.event_status,
  }
}

export function mapAttendanceSummaryRow(r: AttendanceSummaryRow): AttendanceSummary {
  return {
    eventId: r.event_id,
    eventName: r.event_name,
    startDate: toDateOrNull(r.start_date),
    categoryName: r.category_name,
    totalRegistered: r.total_registered,
    totalPresent: r.total_present,
    totalAbsent: r.total_absent,
    attendanceRate: r.attendance_rate,
    totalHours: r.total_hours,
  }
}

export function mapVolunteerHoursSummaryRow(r: VolunteerHoursRow): VolunteerHoursSummary {
  return {
    volunteerId: r.volunteer_id,
    volunteerName: r.volunteer_name,
    totalHours: r.total_hours,
    approvedHours: r.approved_hours,
    eventsCount: r.events_count,
    lastActivity: toDateOrNull(r.last_activity),
  }
}
