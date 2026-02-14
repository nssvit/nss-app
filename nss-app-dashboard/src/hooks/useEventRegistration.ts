'use client'

/**
 * Event Registration Hook
 *
 * Fetches and manages event registration using Server Actions (Drizzle ORM)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getEvents as fetchEventsAction,
  registerForEvent as registerAction,
} from '@/app/actions/events'
import { getVolunteerParticipationHistory } from '@/app/actions/volunteers'
import { useAuth } from '@/contexts/AuthContext'

export interface RegistrableEvent {
  id: string
  name: string
  description: string
  event_date: string
  start_date: string
  end_date: string
  declared_hours: number
  location: string | null
  event_status: string
  min_participants: number | null
  max_participants: number | null
  registration_deadline: string | null
  category_name: string | null
  color_hex: string | null
  participant_count: number
  is_registered: boolean
}

export interface UseEventRegistrationReturn {
  events: RegistrableEvent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  registerForEvent: (eventId: string) => Promise<{ error: string | null }>
  unregisterFromEvent: (eventId: string) => Promise<{ error: string | null }>
}

export function useEventRegistration(): UseEventRegistrationReturn {
  const { currentUser } = useAuth()
  const [events, setEvents] = useState<RegistrableEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!currentUser?.volunteer_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch events and participation in parallel
      const [eventsData, participationData] = await Promise.all([
        fetchEventsAction(),
        getVolunteerParticipationHistory(currentUser.volunteer_id),
      ])

      // Create set of registered event IDs
      const registeredEventIds = new Set((participationData || []).map((p: any) => p.event_id))

      // Transform events to expected format
      const transformedEvents: RegistrableEvent[] = (eventsData || []).map((e: any) => ({
        id: e.id,
        name: e.event_name || e.eventName || '',
        description: e.description || '',
        event_date: e.event_date || e.eventDate || e.start_date || e.startDate || '',
        start_date: e.start_date || e.startDate || '',
        end_date: e.end_date || e.endDate || '',
        declared_hours: e.declared_hours || e.declaredHours || 0,
        location: e.location || null,
        event_status: e.event_status || e.eventStatus || 'planned',
        min_participants: e.min_participants || e.minParticipants || null,
        max_participants: e.max_participants || e.maxParticipants || null,
        registration_deadline: e.registration_deadline || e.registrationDeadline || null,
        category_name: e.category_name || e.category?.categoryName || null,
        color_hex: e.category_color || e.category?.colorHex || null,
        participant_count: e.participant_count || e.participantCount || 0,
        is_registered: registeredEventIds.has(e.id),
      }))

      setEvents(transformedEvents)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events'
      console.error('[useEventRegistration] Error:', message)
      setError(message)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [currentUser?.volunteer_id])

  const handleRegister = useCallback(
    async (eventId: string) => {
      try {
        await registerAction(eventId)
        await fetchData()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to register' }
      }
    },
    [fetchData]
  )

  const handleUnregister = useCallback(async (_eventId: string) => {
    // Note: Unregistration would need a separate server action
    // For now, return error
    return { error: 'Unregistration not implemented via Server Actions yet' }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    events,
    loading,
    error,
    refetch: fetchData,
    registerForEvent: handleRegister,
    unregisterFromEvent: handleUnregister,
  }
}
