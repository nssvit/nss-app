/**
 * Shared row mapping functions
 *
 * Converts snake_case DB rows to camelCase frontend types.
 * Used by both server actions and page.tsx server components
 * to avoid duplicating mapping logic.
 */

import type { VolunteerWithStats, ActivityTrend, EventWithStats, EventParticipationWithEvent } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL result
export function mapVolunteerRow(r: any): VolunteerWithStats {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    rollNumber: r.roll_number,
    branch: r.branch,
    year: r.year,
    phoneNo: r.phone_no,
    birthDate: r.birth_date,
    gender: r.gender,
    nssJoinYear: r.nss_join_year,
    address: r.address,
    profilePic: r.profile_pic,
    isActive: r.is_active,
    authUserId: r.auth_user_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    eventsParticipated: r.events_participated ?? 0,
    totalHours: r.total_hours ?? 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL result
export function mapTrendRow(r: any): ActivityTrend {
  return {
    month: r.month,
    monthNumber: r.month_number,
    yearNumber: r.year_number,
    eventsCount: r.events_count,
    volunteersCount: r.volunteers_count,
    hoursSum: r.hours_sum,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL result
export function mapEventRow(r: any): EventWithStats {
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
    createdBy: r.created_by_volunteer_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    participantCount: r.participant_count ?? 0,
    totalHours: r.total_hours ?? 0,
    categoryName: r.category_name,
    categoryColor: r.category_color,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL result
export function mapParticipationRow(r: any, volunteerId: string): EventParticipationWithEvent {
  return {
    id: r.event_id,
    eventId: r.event_id,
    volunteerId,
    participationStatus: r.participation_status,
    hoursAttended: r.hours_attended ?? 0,
    approvalStatus: r.approval_status ?? 'pending',
    approvedBy: r.approved_by ?? null,
    approvedAt: r.approved_at ?? null,
    feedback: null,
    registeredAt: r.attendance_date ?? new Date(),
    updatedAt: r.attendance_date ?? new Date(),
    eventName: r.event_name,
    categoryName: r.category_name ?? undefined,
  }
}
