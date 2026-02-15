'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { queries } from '@/db/queries'
import { getAuthUser, requireAnyRole } from '@/lib/auth-cache'
import { mapAttendanceSummaryRow } from '@/lib/mappers'
import { logAudit } from '@/lib/audit'

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
  logAudit({ action: 'attendance.mark', actorId: volunteer.id, targetType: 'event', targetId: eventId, details: { volunteerCount: volunteerIds.length, declaredHours } })
  revalidateTag('dashboard-stats')
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
  revalidateTag('dashboard-stats')
  revalidatePath('/attendance')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Sync attendance - replace all participants with selected volunteers
 */
export async function syncAttendance(eventId: string, selectedVolunteerIds: string[]) {
  const volunteer = await requireAnyRole('admin', 'head')
  const result = await queries.syncEventAttendance(eventId, selectedVolunteerIds)
  logAudit({ action: 'attendance.sync', actorId: volunteer.id, targetType: 'event', targetId: eventId, details: { volunteerCount: selectedVolunteerIds.length } })
  revalidateTag('dashboard-stats')
  revalidatePath('/attendance')
  revalidatePath(`/events/${eventId}`)
  return result
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
  revalidateTag('dashboard-stats')
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
  logAudit({ action: 'attendance.bulk', actorId: volunteer.id, targetType: 'event', targetId: params.eventId, details: { volunteerCount: params.volunteerIds.length, status: params.status } })
  revalidateTag('dashboard-stats')
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
