'use server'

import { revalidatePath } from 'next/cache'
import { queries } from '@/db/queries'
import { getAuthUser, getCurrentVolunteer } from '@/lib/auth-cache'
import { mapEventRow } from '@/lib/mappers'

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
  const rows = await queries.getEventsWithStats()
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
  const volunteer = await getCurrentVolunteer() // Gets cached volunteer
  const result = await queries.createEvent(
    {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
    volunteer.id
  )
  revalidatePath('/events')
  return result
}

/**
 * Update an event
 */
export async function updateEvent(eventId: string, updates: UpdateEventInput) {
  await getAuthUser()
  const result = await queries.updateEvent(eventId, {
    ...updates,
    startDate: updates.startDate ? new Date(updates.startDate) : undefined,
    endDate: updates.endDate ? new Date(updates.endDate) : undefined,
  })
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Delete (soft-delete) an event
 */
export async function deleteEvent(eventId: string) {
  await getAuthUser()
  const result = await queries.deleteEvent(eventId)
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
    approvedBy: null,
    approvedAt: null,
    feedback: r.notes,
    registeredAt: r.registration_date,
    updatedAt: r.attendance_date ?? r.registration_date,
  }))
}

/**
 * Register for an event
 */
export async function registerForEvent(eventId: string) {
  const volunteer = await getCurrentVolunteer()
  const result = await queries.registerForEvent(eventId, volunteer.id)
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Check if registration is possible for an event
 */
export async function canRegisterForEvent(eventId: string) {
  try {
    const volunteer = await getCurrentVolunteer()
    return queries.canRegisterForEvent(eventId, volunteer.id)
  } catch {
    return queries.canRegisterForEvent(eventId)
  }
}
