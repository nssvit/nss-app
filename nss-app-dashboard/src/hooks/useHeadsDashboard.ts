'use client'

/**
 * Heads Dashboard Hook
 * OPTIMIZED: Added client-side caching and prefetch support
 * Fetches heads dashboard stats using Server Actions (Drizzle ORM)
 * Shows events created by the current head/lead
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getHeadsDashboardStats, getVolunteerHoursSummary } from '@/app/actions/dashboard'
import { getPrefetchedHeadsDashboard } from '@/lib/data-prefetch'

// Client-side cache
interface HeadsDashboardCache {
  stats: HeadsDashboardStats | null
  myEvents: HeadEvent[]
  volunteerHours: VolunteerHours[]
  timestamp: number
}

const headsDashboardCache: HeadsDashboardCache = {
  stats: null,
  myEvents: [],
  volunteerHours: [],
  timestamp: 0,
}
const CACHE_DURATION = 60000 // 1 minute

export interface HeadsDashboardStats {
  myEvents: number
  totalParticipants: number
  hoursManaged: number
  activeEvents: number
}

export interface HeadEvent {
  id: string
  event_name: string
  event_description: string
  start_date: string
  event_date: string
  declared_hours: number
  is_active: boolean
  created_at: string
  category_name: string
  participant_count: number
  total_hours: number
}

export interface VolunteerHours {
  volunteer_id: string
  volunteer_name: string
  total_hours: number
  approved_hours: number
  events_count: number
  last_activity: string | null
}

export interface UseHeadsDashboardReturn {
  stats: HeadsDashboardStats | null
  myEvents: HeadEvent[]
  volunteerHours: VolunteerHours[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useHeadsDashboard(): UseHeadsDashboardReturn {
  const [stats, setStats] = useState<HeadsDashboardStats | null>(headsDashboardCache.stats)
  const [myEvents, setMyEvents] = useState<HeadEvent[]>(headsDashboardCache.myEvents)
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours[]>(
    headsDashboardCache.volunteerHours
  )
  const [loading, setLoading] = useState(!headsDashboardCache.stats)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now()

    // Check prefetched data first (highest priority)
    if (!forceRefresh) {
      const prefetched = getPrefetchedHeadsDashboard()
      if (prefetched) {
        setStats(prefetched.stats)
        setMyEvents(prefetched.events as HeadEvent[])
        // Update local cache
        headsDashboardCache.stats = prefetched.stats
        headsDashboardCache.myEvents = prefetched.events as HeadEvent[]
        headsDashboardCache.timestamp = now
        setLoading(false)
        // Still fetch volunteer hours separately if not in prefetch
        getVolunteerHoursSummary(10)
          .then((hoursData) => {
            setVolunteerHours(hoursData as VolunteerHours[])
            headsDashboardCache.volunteerHours = hoursData as VolunteerHours[]
          })
          .catch(() => {})
        return
      }

      // Use local cache if valid
      if (headsDashboardCache.stats && now - headsDashboardCache.timestamp < CACHE_DURATION) {
        setStats(headsDashboardCache.stats)
        setMyEvents(headsDashboardCache.myEvents)
        setVolunteerHours(headsDashboardCache.volunteerHours)
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

      // Fetch all data in parallel using Server Actions
      const [dashboardData, hoursData] = await Promise.all([
        getHeadsDashboardStats(),
        getVolunteerHoursSummary(10),
      ])

      // Update cache
      headsDashboardCache.stats = dashboardData.stats
      headsDashboardCache.myEvents = dashboardData.events as HeadEvent[]
      headsDashboardCache.volunteerHours = hoursData as VolunteerHours[]
      headsDashboardCache.timestamp = now

      setStats(dashboardData.stats)
      setMyEvents(dashboardData.events as HeadEvent[])
      setVolunteerHours(hoursData as VolunteerHours[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch heads dashboard data'
      console.error('[useHeadsDashboard] Error:', message)
      setError(message)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    stats,
    myEvents,
    volunteerHours,
    loading,
    error,
    refetch: () => fetchData(true),
  }
}
