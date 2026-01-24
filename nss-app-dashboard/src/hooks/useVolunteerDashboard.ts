'use client'

/**
 * Volunteer Dashboard Hook
 *
 * Fetches volunteer's personal dashboard data using Server Actions (Drizzle ORM)
 */

import { useState, useEffect, useCallback } from 'react'
import { getVolunteerDashboardData } from '@/app/actions/volunteers'
import { registerForEvent as registerAction } from '@/app/actions/events'

export interface VolunteerStats {
  totalHours: number
  approvedHours: number
  eventsParticipated: number
  pendingReviews: number
}

export interface MyParticipation {
  event_id: string
  event_name: string
  event_date: string | null
  category_name: string | null
  participation_status: string
  hours_attended: number
  attendance_date: Date | null
}

export interface AvailableEvent {
  id: string
  eventName: string
  startDate: string
  description: string | null
  declaredHours: number
  category?: { categoryName: string; colorHex: string | null }
  registrationDeadline: Date | null
}

export interface UseVolunteerDashboardReturn {
  stats: VolunteerStats | null
  myParticipation: MyParticipation[]
  availableEvents: AvailableEvent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  registerForEvent: (eventId: string) => Promise<{ error: string | null }>
}

export function useVolunteerDashboard(): UseVolunteerDashboardReturn {
  const [stats, setStats] = useState<VolunteerStats | null>(null)
  const [myParticipation, setMyParticipation] = useState<MyParticipation[]>([])
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getVolunteerDashboardData()

      setStats(data.stats)
      setMyParticipation(data.participation as MyParticipation[])
      setAvailableEvents(data.availableEvents as AvailableEvent[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data'
      console.error('[useVolunteerDashboard] Error:', message)
      setError(message)
      setStats(null)
      setMyParticipation([])
      setAvailableEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRegister = useCallback(
    async (eventId: string) => {
      try {
        await registerAction(eventId)
        await fetchData() // Refresh data
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to register' }
      }
    },
    [fetchData]
  )

  // Initial fetch on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    stats,
    myParticipation,
    availableEvents,
    loading,
    error,
    refetch: fetchData,
    registerForEvent: handleRegister,
  }
}
