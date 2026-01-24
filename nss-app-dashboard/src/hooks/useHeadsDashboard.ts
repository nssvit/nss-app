'use client'

/**
 * Heads Dashboard Hook
 *
 * Fetches heads dashboard stats using Server Actions (Drizzle ORM)
 * Shows events created by the current head/lead
 */

import { useState, useEffect, useCallback } from 'react'
import { getHeadsDashboardStats, getVolunteerHoursSummary } from '@/app/actions/dashboard'

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
  const [stats, setStats] = useState<HeadsDashboardStats | null>(null)
  const [myEvents, setMyEvents] = useState<HeadEvent[]>([])
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel using Server Actions
      const [dashboardData, hoursData] = await Promise.all([
        getHeadsDashboardStats(),
        getVolunteerHoursSummary(10),
      ])

      setStats(dashboardData.stats)
      setMyEvents(dashboardData.events as HeadEvent[])
      setVolunteerHours(hoursData as VolunteerHours[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch heads dashboard data'
      console.error('[useHeadsDashboard] Error:', message)
      setError(message)
      setStats(null)
      setMyEvents([])
      setVolunteerHours([])
    } finally {
      setLoading(false)
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
    refetch: fetchData,
  }
}
