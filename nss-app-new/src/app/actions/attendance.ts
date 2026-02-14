'use server'

import { revalidatePath } from 'next/cache'
import { queries } from '@/db/queries'
import { getAuthUser, requireAnyRole } from '@/lib/auth-cache'
import { mapAttendanceSummaryRow } from '@/lib/mappers'

/**
 * Mark attendance for multiple volunteers at an event
 */
export async function markAttendance(
  eventId: string,
  volunteerIds: string[],
  declaredHours?: number
) {
  const volunteer = await requireAnyRole('admin', 'head')
  const result = await queries.markEventAttendance(eventId, volunteerIds, declaredHours, volunteer.id)
  revalidatePath('/attendance')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Update attendance list (add new, keep existing)
 */
export async function updateAttendance(eventId: string, volunteerIds: string[]) {
  const volunteer = await requireAnyRole('admin', 'head')
  const result = await queries.updateEventAttendance(eventId, volunteerIds, volunteer.id)
  revalidatePath('/attendance')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Sync attendance - replace all participants with selected volunteers
 */
export async function syncAttendance(eventId: string, selectedVolunteerIds: string[]) {
  await requireAnyRole('admin', 'head')
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
  await getAuthUser()
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
    approvedBy: r.approved_by ?? null,
    approvedAt: r.approved_at ?? null,
    approvedHours: r.approved_hours ?? null,
    feedback: r.notes,
    registeredAt: r.registration_date,
    updatedAt: r.attendance_date ?? r.registration_date,
  }))
}

/**
 * Get attendance summary for all events
 */
export async function getAttendanceSummary() {
  await getAuthUser()
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
  await requireAnyRole('admin', 'head')
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
  const volunteer = await requireAnyRole('admin', 'head')
  const result = await queries.bulkMarkAttendance({
    eventId: params.eventId,
    volunteerIds: params.volunteerIds,
    status: params.status,
    hoursAttended: params.hoursAttended,
    notes: params.notes,
    recordedBy: volunteer.id,
  })
  revalidatePath('/attendance')
  revalidatePath(`/events/${params.eventId}`)
  return result
}

/**
 * Get events list for attendance manager
 */
export async function getEventsForAttendance(limit: number = 50) {
  await getAuthUser()
  return queries.getEventsForAttendance(limit)
}
