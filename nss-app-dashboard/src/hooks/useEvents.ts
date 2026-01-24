'use client'

/**
 * Events Hook
 * Uses Server Actions (Drizzle ORM) - no direct Supabase client
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getEvents,
  getEventById,
  createEvent as createEventAction,
  updateEvent as updateEventAction,
  deleteEvent as deleteEventAction,
  registerForEvent as registerForEventAction,
  type CreateEventInput,
  type UpdateEventInput,
} from '@/app/actions/events'

export interface EventWithDetails {
  id: string
  eventName: string
  description: string | null
  startDate: string
  endDate: string
  eventDate: Date | null
  declaredHours: number
  categoryId: number
  minParticipants: number | null
  maxParticipants: number | null
  eventStatus: string
  location: string | null
  registrationDeadline: Date | null
  createdByVolunteerId: string
  isActive: boolean | null
  createdAt: Date
  updatedAt: Date
  // Stats from query
  participantCount?: number
  categoryName?: string
  categoryColor?: string
  // Legacy aliases
  event_name?: string
  start_date?: string
  end_date?: string
  declared_hours?: number
  category_id?: number
  event_status?: string
  is_active?: boolean
}

export function useEvents() {
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEvents()

      // Transform and add legacy aliases for compatibility
      const transformed = (data || []).map((event: any) => ({
        ...event,
        // Snake case aliases
        event_name: event.eventName,
        start_date: event.startDate,
        end_date: event.endDate,
        declared_hours: event.declaredHours,
        category_id: event.categoryId,
        event_status: event.eventStatus,
        is_active: event.isActive,
      }))

      setEvents(transformed)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events'
      console.error('[useEvents] Error:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const addEvent = useCallback(
    async (eventData: CreateEventInput) => {
      try {
        const result = await createEventAction(eventData)
        await fetchEvents()
        return { data: result, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create event'
        return { data: null, error: message }
      }
    },
    [fetchEvents]
  )

  const updateEvent = useCallback(
    async (id: string, updates: UpdateEventInput) => {
      try {
        const result = await updateEventAction(id, updates)
        await fetchEvents()
        return { data: result, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update event'
        return { data: null, error: message }
      }
    },
    [fetchEvents]
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      try {
        await deleteEventAction(id)
        await fetchEvents()
        return { error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete event'
        return { error: message }
      }
    },
    [fetchEvents]
  )

  const registerForEvent = useCallback(
    async (eventId: string, declaredHours?: number) => {
      try {
        const result = await registerForEventAction(eventId, declaredHours)
        await fetchEvents()
        return { data: result, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to register for event'
        return { data: null, error: message }
      }
    },
    [fetchEvents]
  )

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    fetchEvents, // Legacy alias
    addEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
  }
}
