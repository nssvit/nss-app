'use server'

import { revalidatePath } from 'next/cache'
import { queries } from '@/db/queries'
import { getAuthUser, getCurrentVolunteer } from '@/lib/auth-cache'

// Types for event creation/update
export interface CreateEventInput {
  eventName: string
  description?: string
  startDate: string
  endDate: string
  eventDate?: Date
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
  eventDate?: Date
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
 */
export async function getEvents() {
  await getAuthUser() // Cached auth check
  return queries.getEventsWithStats()
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
  const result = await queries.createEvent(data, volunteer.id)
  revalidatePath('/events')
  return result
}

/**
 * Update an event
 */
export async function updateEvent(eventId: string, updates: UpdateEventInput) {
  await getAuthUser()
  const result = await queries.updateEvent(eventId, updates)
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
 */
export async function getEventParticipants(eventId: string) {
  await getAuthUser()
  return queries.getEventParticipants(eventId)
}

/**
 * Register for an event
 */
export async function registerForEvent(eventId: string, declaredHours?: number) {
  const volunteer = await getCurrentVolunteer()
  const result = await queries.registerForEvent(eventId, volunteer.id, declaredHours)
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
