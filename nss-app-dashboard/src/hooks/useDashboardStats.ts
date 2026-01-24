'use client'

/**
 * Dashboard Statistics Hook
 *
 * Fetches dashboard stats using Server Actions (Drizzle ORM)
 * Simplified from 216 LOC to ~80 LOC
 */

import { useState, useEffect, useCallback } from 'react'
import { getDashboardStats, getMonthlyTrends } from '@/app/actions/dashboard'
import { getUpcomingEvents } from '@/app/actions/events'

// Types inferred from server actions
export interface DashboardStats {
  totalEvents: number
  activeVolunteers: number
  totalHours: number
  ongoingProjects: number
}

export interface ActivityTrend {
  month: string
  eventsCount: number
  volunteersCount: number
  hoursSum: number
}

export interface RecentEvent {
  id: string
  eventName: string
  startDate: string
  eventStatus: string
  categoryId: number
}

export interface UseDashboardStatsReturn {
  stats: DashboardStats | null
  activityData: ActivityTrend[]
  recentEvents: RecentEvent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activityData, setActivityData] = useState<ActivityTrend[]>([])
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel using Server Actions
      const [statsData, trendsData, eventsData] = await Promise.all([
        getDashboardStats(),
        getMonthlyTrends(),
        getUpcomingEvents(3),
      ])

      setStats(statsData)
      setActivityData(trendsData)
      setRecentEvents(eventsData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data'
      console.error('[useDashboardStats] Error:', message)
      setError(message)
      setStats(null)
      setActivityData([])
      setRecentEvents([])
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
    activityData,
    recentEvents,
    loading,
    error,
    refetch: fetchData,
  }
}
