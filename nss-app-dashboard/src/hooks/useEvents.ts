'use client'

/**
 * Events Hook
 *
 * Fetches and manages events using Server Actions (Drizzle ORM)
 * Simplified from 171 LOC to ~90 LOC
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getEvents as fetchEventsAction,
  createEvent as createEventAction,
  updateEvent as updateEventAction,
  deleteEvent as deleteEventAction,
  registerForEvent as registerAction,
  type CreateEventInput,
  type UpdateEventInput,
} from '@/app/actions/events'
import type { Event } from '@/db/schema'

// Extended event type with relations
export interface EventWithDetails extends Event {
  participantCount?: number
  totalHours?: number
  category?: { categoryName: string; colorHex: string | null }
  createdBy?: { firstName: string; lastName: string }
}

export interface UseEventsReturn {
  events: EventWithDetails[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createEvent: (data: CreateEventInput) => Promise<{ error: string | null }>
  updateEvent: (id: string, data: UpdateEventInput) => Promise<{ error: string | null }>
  deleteEvent: (id: string) => Promise<{ error: string | null }>
  registerForEvent: (eventId: string) => Promise<{ error: string | null }>
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const eventsData = await fetchEventsAction()
      setEvents(eventsData as EventWithDetails[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events'
      console.error('[useEvents] Error:', message)
      setError(message)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreateEvent = useCallback(
    async (data: CreateEventInput) => {
      try {
        await createEventAction(data)
        await fetchEvents()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to create event' }
      }
    },
    [fetchEvents]
  )

  const handleUpdateEvent = useCallback(
    async (id: string, data: UpdateEventInput) => {
      try {
        await updateEventAction(id, data)
        await fetchEvents()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to update event' }
      }
    },
    [fetchEvents]
  )

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      try {
        await deleteEventAction(id)
        await fetchEvents()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to delete event' }
      }
    },
    [fetchEvents]
  )

  const handleRegister = useCallback(
    async (eventId: string) => {
      try {
        await registerAction(eventId)
        await fetchEvents()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to register for event' }
      }
    },
    [fetchEvents]
  )

  // Initial fetch on mount
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    createEvent: handleCreateEvent,
    updateEvent: handleUpdateEvent,
    deleteEvent: handleDeleteEvent,
    registerForEvent: handleRegister,
  }
}
