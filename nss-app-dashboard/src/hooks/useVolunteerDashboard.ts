'use client'

/**
 * Volunteer Dashboard Hook
 * OPTIMIZED: Client-side caching to prevent redundant fetches
 * Fetches volunteer's personal dashboard data using Server Actions (Drizzle ORM)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getVolunteerDashboardData } from '@/app/actions/volunteers'
import { registerForEvent as registerAction } from '@/app/actions/events'
import { getPrefetchedVolunteerDashboard } from '@/lib/data-prefetch'

// Client-side cache
interface VolunteerDashboardCache {
  stats: VolunteerStats | null
  myParticipation: MyParticipation[]
  availableEvents: AvailableEvent[]
  timestamp: number
}

const volunteerDashboardCache: VolunteerDashboardCache = {
  stats: null,
  myParticipation: [],
  availableEvents: [],
  timestamp: 0,
}
const CACHE_DURATION = 60000 // 1 minute

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
  const [stats, setStats] = useState<VolunteerStats | null>(volunteerDashboardCache.stats)
  const [myParticipation, setMyParticipation] = useState<MyParticipation[]>(
    volunteerDashboardCache.myParticipation
  )
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>(
    volunteerDashboardCache.availableEvents
  )
  const [loading, setLoading] = useState(!volunteerDashboardCache.stats) // Not loading if cache exists
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now()

    // Check prefetched data first (highest priority)
    if (!forceRefresh) {
      const prefetched = getPrefetchedVolunteerDashboard()
      if (prefetched) {
        setStats(prefetched.stats)
        setMyParticipation(prefetched.participation as MyParticipation[])
        setAvailableEvents(prefetched.availableEvents as AvailableEvent[])
        // Update local cache too
        volunteerDashboardCache.stats = prefetched.stats
        volunteerDashboardCache.myParticipation = prefetched.participation as MyParticipation[]
        volunteerDashboardCache.availableEvents = prefetched.availableEvents as AvailableEvent[]
        volunteerDashboardCache.timestamp = now
        setLoading(false)
        return
      }

      // Use local cache if valid
      if (
        volunteerDashboardCache.stats &&
        now - volunteerDashboardCache.timestamp < CACHE_DURATION
      ) {
        setStats(volunteerDashboardCache.stats)
        setMyParticipation(volunteerDashboardCache.myParticipation)
        setAvailableEvents(volunteerDashboardCache.availableEvents)
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

      const data = await getVolunteerDashboardData()

      // Update cache
      volunteerDashboardCache.stats = data.stats
      volunteerDashboardCache.myParticipation = data.participation as MyParticipation[]
      volunteerDashboardCache.availableEvents = data.availableEvents as AvailableEvent[]
      volunteerDashboardCache.timestamp = now

      setStats(data.stats)
      setMyParticipation(data.participation as MyParticipation[])
      setAvailableEvents(data.availableEvents as AvailableEvent[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data'
      console.error('[useVolunteerDashboard] Error:', message)
      setError(message)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Invalidate cache helper
  const invalidateCache = useCallback(() => {
    volunteerDashboardCache.stats = null
    volunteerDashboardCache.myParticipation = []
    volunteerDashboardCache.availableEvents = []
    volunteerDashboardCache.timestamp = 0
  }, [])

  const handleRegister = useCallback(
    async (eventId: string) => {
      try {
        await registerAction(eventId)
        invalidateCache()
        await fetchData(true) // Force refresh
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to register' }
      }
    },
    [fetchData, invalidateCache]
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
    refetch: () => fetchData(true),
    registerForEvent: handleRegister,
  }
}
