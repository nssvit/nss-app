'use server'

import { revalidatePath } from 'next/cache'
import { queries } from '@/db/queries'
import { createClient } from '@/lib/supabase/server'
import { mapAttendanceSummaryRow } from '@/lib/mappers'

/**
 * Auth helper - ensures user is authenticated
 */
async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Please sign in')
  }

  return user
}

/**
 * Get current user's volunteer ID
 */
async function getCurrentVolunteerId() {
  const user = await requireAuth()
  const volunteer = await queries.getVolunteerByAuthId(user.id)
  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }
  return volunteer.id
}

/**
 * Mark attendance for multiple volunteers at an event
 */
export async function markAttendance(
  eventId: string,
  volunteerIds: string[],
  declaredHours?: number
) {
  const recordedBy = await getCurrentVolunteerId()
  const result = await queries.markEventAttendance(eventId, volunteerIds, declaredHours, recordedBy)
  revalidatePath('/attendance')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Update attendance list (add new, keep existing)
 */
export async function updateAttendance(eventId: string, volunteerIds: string[]) {
  const recordedBy = await getCurrentVolunteerId()
  const result = await queries.updateEventAttendance(eventId, volunteerIds, recordedBy)
  revalidatePath('/attendance')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Sync attendance - replace all participants with selected volunteers
 */
export async function syncAttendance(eventId: string, selectedVolunteerIds: string[]) {
  await requireAuth()
  const result = await queries.syncEventAttendance(eventId, selectedVolunteerIds)
  revalidatePath('/attendance')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Get participants for an event
 * Maps snake_case DB rows to camelCase frontend types
 */
export async function getEventParticipants(eventId: string) {
  await requireAuth()
  const rows = await queries.getEventParticipants(eventId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL result
  return rows.map((r: any) => ({
    id: r.participant_id,
    eventId,
    volunteerId: r.volunteer_id,
    volunteerName: r.volunteer_name,
    participationStatus: r.participation_status,
    hoursAttended: r.hours_attended ?? 0,
    approvalStatus: r.approval_status ?? 'pending',
    approvedBy: null,
    approvedAt: null,
    feedback: r.notes,
    registeredAt: r.registration_date,
    updatedAt: r.attendance_date ?? r.registration_date,
  }))
}

/**
 * Get attendance summary for all events
 */
export async function getAttendanceSummary() {
  await requireAuth()
  const rows = await queries.getAttendanceSummary()
  return rows.map(mapAttendanceSummaryRow)
}

/**
 * Update individual participation status
 */
export async function updateParticipationStatus(
  participantId: string,
  status: string,
  hoursAttended?: number,
  notes?: string
) {
  await requireAuth()
  const result = await queries.updateParticipationStatus(participantId, {
    participationStatus: status,
    hoursAttended,
    notes,
  })
  revalidatePath('/attendance')
  return result
}

/**
 * Bulk mark attendance with specific status
 */
export async function bulkMarkAttendance(params: {
  eventId: string
  volunteerIds: string[]
  status: string
  hoursAttended?: number
  notes?: string
}) {
  const recordedBy = await getCurrentVolunteerId()
  const result = await queries.bulkMarkAttendance({
    eventId: params.eventId,
    volunteerIds: params.volunteerIds,
    status: params.status,
    hoursAttended: params.hoursAttended,
    notes: params.notes,
    recordedBy,
  })
  revalidatePath('/attendance')
  revalidatePath(`/events/${params.eventId}`)
  return result
}

/**
 * Get events list for attendance manager
 */
export async function getEventsForAttendance(limit: number = 50) {
  await requireAuth()
  return queries.getEventsForAttendance(limit)
}
