'use client'

/**
 * Events Hook
 * Uses Server Actions (Drizzle ORM) - no direct Supabase client
 * OPTIMIZED: Added client-side caching and prefetch support
 */

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { getPrefetchedEvents } from '@/lib/data-prefetch'

// Simple in-memory cache for events
const eventsCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_DURATION = 60000 // 1 minute

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
  const fetchingRef = useRef(false)

  const fetchEvents = useCallback(async (forceRefresh = false) => {
    const now = Date.now()

    // Check prefetched data first (highest priority)
    if (!forceRefresh) {
      const prefetched = getPrefetchedEvents()
      if (prefetched) {
        const transformed = prefetched.map((event: any) => ({
          ...event,
          event_name: event.eventName,
          start_date: event.startDate,
          end_date: event.endDate,
          declared_hours: event.declaredHours,
          category_id: event.categoryId,
          event_status: event.eventStatus,
          is_active: event.isActive,
        }))
        eventsCache.data = transformed
        eventsCache.timestamp = now
        setEvents(transformed)
        setLoading(false)
        return
      }

      // Use local cache if valid
      if (eventsCache.data && now - eventsCache.timestamp < CACHE_DURATION) {
        setEvents(eventsCache.data)
        setLoading(false)
        return
      }
    }

    // Prevent duplicate fetches
    if (fetchingRef.current) return
    fetchingRef.current = true

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

      // Update cache
      eventsCache.data = transformed
      eventsCache.timestamp = now

      setEvents(transformed)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events'
      console.error('[useEvents] Error:', message)
      setError(message)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Invalidate cache helper
  const invalidateCache = useCallback(() => {
    eventsCache.data = null
    eventsCache.timestamp = 0
  }, [])

  const addEvent = useCallback(
    async (eventData: CreateEventInput) => {
      try {
        const result = await createEventAction(eventData)
        invalidateCache()
        await fetchEvents(true) // Force refresh
        return { data: result, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create event'
        return { data: null, error: message }
      }
    },
    [fetchEvents, invalidateCache]
  )

  const updateEvent = useCallback(
    async (id: string, updates: UpdateEventInput) => {
      try {
        const result = await updateEventAction(id, updates)
        invalidateCache()
        await fetchEvents(true) // Force refresh
        return { data: result, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update event'
        return { data: null, error: message }
      }
    },
    [fetchEvents, invalidateCache]
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      try {
        await deleteEventAction(id)
        invalidateCache()
        await fetchEvents(true) // Force refresh
        return { error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete event'
        return { error: message }
      }
    },
    [fetchEvents, invalidateCache]
  )

  const registerForEvent = useCallback(
    async (eventId: string, declaredHours?: number) => {
      try {
        const result = await registerForEventAction(eventId, declaredHours)
        invalidateCache()
        await fetchEvents(true) // Force refresh
        return { data: result, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to register for event'
        return { data: null, error: message }
      }
    },
    [fetchEvents, invalidateCache]
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
