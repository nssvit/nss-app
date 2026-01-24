'use server'

import { queries } from '@/db/queries'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Auth helper - ensures user is authenticated
 */
async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Please sign in')
  }

  return user
}

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
  await requireAuth()
  return queries.getEventsWithStats()
}

/**
 * Get a single event by ID with full details
 */
export async function getEventById(eventId: string) {
  await requireAuth()
  return queries.getEventById(eventId)
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(limit?: number) {
  await requireAuth()
  return queries.getUpcomingEvents(limit)
}

/**
 * Create a new event
 */
export async function createEvent(data: CreateEventInput) {
  const user = await requireAuth()

  // Get the volunteer ID for the current user
  const volunteer = await queries.getVolunteerByAuthId(user.id)
  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }

  const result = await queries.createEvent(data, volunteer.id)
  revalidatePath('/events')
  return result
}

/**
 * Update an event
 */
export async function updateEvent(eventId: string, updates: UpdateEventInput) {
  await requireAuth()
  const result = await queries.updateEvent(eventId, updates)
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Delete (soft-delete) an event
 */
export async function deleteEvent(eventId: string) {
  await requireAuth()
  const result = await queries.deleteEvent(eventId)
  revalidatePath('/events')
  return result
}

/**
 * Get event participants
 */
export async function getEventParticipants(eventId: string) {
  await requireAuth()
  return queries.getEventParticipants(eventId)
}

/**
 * Register for an event
 */
export async function registerForEvent(eventId: string, declaredHours?: number) {
  const user = await requireAuth()

  const volunteer = await queries.getVolunteerByAuthId(user.id)
  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }

  const result = await queries.registerForEvent(eventId, volunteer.id, declaredHours)
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return result
}

/**
 * Check if registration is possible for an event
 */
export async function canRegisterForEvent(eventId: string) {
  const user = await requireAuth()

  const volunteer = await queries.getVolunteerByAuthId(user.id)
  return queries.canRegisterForEvent(eventId, volunteer?.id)
}
