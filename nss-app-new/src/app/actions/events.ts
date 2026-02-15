'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { queries } from '@/db/queries'
import { getAuthUser, getCurrentVolunteer, requireAnyRole } from '@/lib/auth-cache'
import { mapEventRow } from '@/lib/mappers'
import { STATUS_TRANSITIONS } from '@/lib/constants'
import { logAudit } from '@/lib/audit'

// Types for event creation/update
export interface CreateEventInput {
  eventName: string
  description?: string
  startDate: string
  endDate: string
  declaredHours: number
  categoryId: number
  minParticipants?: number
  maxParticipants?: number
  eventStatus?: string
  location?: string
  registrationDeadline?: Date
  volunteerIds?: string[]
}

export interface UpdateEventInput {
  eventName?: string
  description?: string
  startDate?: string
  endDate?: string
  declaredHours?: number
  categoryId?: number
  minParticipants?: number
  maxParticipants?: number
  eventStatus?: string
  location?: string
  registrationDeadline?: Date
  isActive?: boolean
}

/**
 * Get all events with participant stats
 * Maps snake_case DB rows to camelCase frontend types
 */
export async function getEvents() {
  await getAuthUser() // Cached auth check
  const volunteer = await getCurrentVolunteer()
  const rows = await queries.getEventsWithStats(volunteer.id)
  return rows.map(mapEventRow)
}

/**
 * Get a single event by ID with full details
 */
export async function getEventById(eventId: string) {
  await getAuthUser()
  return queries.getEventById(eventId)
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(limit?: number) {
  await getAuthUser()
  return queries.getUpcomingEvents(limit)
}

/**
 * Create a new event
 */
export async function createEvent(data: CreateEventInput) {
  const volunteer = await requireAnyRole('admin', 'head')
  const result = await queries.createEvent(
    {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
    volunteer.id,
    data.volunteerIds
  )
  logAudit({ action: 'event.create', actorId: volunteer.id, targetType: 'event', details: { eventName: data.eventName } })
  revalidateTag('dashboard-stats')
  revalidatePath('/events')
  revalidatePath('/event-registration')
  return result
}

/**
 * Update an event
 */
export async function updateEvent(eventId: string, updates: UpdateEventInput) {
  const actor = await requireAnyRole('admin', 'head')

  // Validate status transition if status is being changed
  let shouldResetAttendance = false
  if (updates.eventStatus) {
    const event = await queries.getEventById(eventId)
    if (!event) throw new Error('Event not found')

    const currentStatus = event.eventStatus
    const allowed = STATUS_TRANSITIONS[currentStatus]
    if (allowed && !allowed.includes(updates.eventStatus)) {
      throw new Error(
        `Invalid status transition: cannot go from "${currentStatus}" to "${updates.eventStatus}". Allowed: [${allowed.join(', ')}]`
      )
    }

    // If moving from a post-attendance state back to a pre-attendance state,
    // reset all attendance records (hours, present/absent → registered)
    const postAttendanceStates = ['ongoing', 'completed']
    const preAttendanceStates = ['planned', 'registration_open', 'registration_closed']
    if (
      postAttendanceStates.includes(currentStatus) &&
      preAttendanceStates.includes(updates.eventStatus)
    ) {
      shouldResetAttendance = true
    }
  }

  const result = await queries.updateEvent(eventId, {
    ...updates,
    startDate: updates.startDate ? new Date(updates.startDate) : undefined,
    endDate: updates.endDate ? new Date(updates.endDate) : undefined,
  })

  // Reset attendance if reopening the event
  if (shouldResetAttendance) {
    await queries.resetEventAttendance(eventId)
  }

  logAudit({ action: 'event.update', actorId: actor.id, targetType: 'event', targetId: eventId, details: { ...updates } })
  revalidateTag('dashboard-stats')
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/volunteers')
  return result
}

/**
 * Delete (soft-delete) an event
 */
export async function deleteEvent(eventId: string) {
  const actor = await requireAnyRole('admin', 'head')
  const result = await queries.deleteEvent(eventId)
  logAudit({ action: 'event.delete', actorId: actor.id, targetType: 'event', targetId: eventId })
  revalidateTag('dashboard-stats')
  revalidatePath('/events')
  return result
}

/**
 * Get event participants
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
    notes: r.notes,
    registeredAt: r.registration_date,
    updatedAt: r.attendance_date ?? r.registration_date,
  }))
}

/**
 * Register for an event (self-service — any authenticated volunteer)
 */
export async function registerForEvent(eventId: string) {
  const volunteer = await getCurrentVolunteer()
  const result = await queries.registerForEvent(eventId, volunteer.id)
  logAudit({ action: 'event.register', actorId: volunteer.id, targetType: 'event', targetId: eventId })
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Add volunteers to an event (admin/head only).
 * Registers each volunteer, skipping any already registered.
 */
export async function addVolunteersToEvent(eventId: string, volunteerIds: string[]) {
  await requireAnyRole('admin', 'head')
  if (volunteerIds.length === 0) return { added: 0 }

  let added = 0
  for (const vid of volunteerIds) {
    try {
      await queries.registerForEvent(eventId, vid)
      added++
    } catch {
      // Skip already-registered volunteers
    }
  }

  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return { added }
}

/**
 * Check if registration is possible for an event.
 * Supports unauthenticated callers (returns capacity-only check).
 */
export async function canRegisterForEvent(eventId: string) {
  try {
    const volunteer = await getCurrentVolunteer()
    return queries.canRegisterForEvent(eventId, volunteer.id)
  } catch {
    // Unauthenticated: check event availability only
    return queries.canRegisterForEvent(eventId)
  }
}
