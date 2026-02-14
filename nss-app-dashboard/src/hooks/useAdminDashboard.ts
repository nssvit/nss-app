'use client'

/**
 * Admin Dashboard Hook
 * OPTIMIZED: Client-side caching to prevent redundant fetches
 * Fetches admin dashboard stats using Server Actions (Drizzle ORM)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getFullAdminDashboard } from '@/app/actions/dashboard'
import { getPrefetchedAdminDashboard } from '@/lib/data-prefetch'

// Client-side cache
interface AdminDashboardCache {
  stats: AdminDashboardStats | null
  monthlyStats: MonthlyStats | null
  alerts: Alerts | null
  recentEvents: RecentEvent[]
  timestamp: number
}

const adminDashboardCache: AdminDashboardCache = {
  stats: null,
  monthlyStats: null,
  alerts: null,
  recentEvents: [],
  timestamp: 0,
}
const CACHE_DURATION = 60000 // 1 minute

export interface AdminDashboardStats {
  totalVolunteers: number
  totalEvents: number
  totalHours: number
  pendingReviews: number
  activeEvents: number
}

export interface MonthlyStats {
  hoursLogged: number
  eventsCreated: number
  newVolunteers: number
}

export interface Alerts {
  pendingReviews: number
  eventsEndingSoon: number
  newRegistrations: number
}

export interface RecentEvent {
  id: string
  event_name: string
  event_description: string
  start_date: string
  event_date: string
  declared_hours: number
  is_active: boolean
  created_at: string
  category_name: string
  color_hex: string | null
  creator_first_name: string
  creator_last_name: string
  participant_count: number
}

export interface UseAdminDashboardReturn {
  stats: AdminDashboardStats | null
  monthlyStats: MonthlyStats | null
  alerts: Alerts | null
  recentEvents: RecentEvent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const [stats, setStats] = useState<AdminDashboardStats | null>(adminDashboardCache.stats)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(
    adminDashboardCache.monthlyStats
  )
  const [alerts, setAlerts] = useState<Alerts | null>(adminDashboardCache.alerts)
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>(adminDashboardCache.recentEvents)
  const [loading, setLoading] = useState(!adminDashboardCache.stats) // Not loading if cache exists
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now()

    // Check prefetched data first (highest priority)
    if (!forceRefresh) {
      const prefetched = getPrefetchedAdminDashboard()
      if (prefetched) {
        setStats(prefetched.stats)
        setMonthlyStats(prefetched.monthlyStats)
        setAlerts(prefetched.alerts)
        setRecentEvents(prefetched.recentEvents as RecentEvent[])
        // Update local cache too
        adminDashboardCache.stats = prefetched.stats
        adminDashboardCache.monthlyStats = prefetched.monthlyStats
        adminDashboardCache.alerts = prefetched.alerts
        adminDashboardCache.recentEvents = prefetched.recentEvents as RecentEvent[]
        adminDashboardCache.timestamp = now
        setLoading(false)
        return
      }

      // Use local cache if valid
      if (adminDashboardCache.stats && now - adminDashboardCache.timestamp < CACHE_DURATION) {
        setStats(adminDashboardCache.stats)
        setMonthlyStats(adminDashboardCache.monthlyStats)
        setAlerts(adminDashboardCache.alerts)
        setRecentEvents(adminDashboardCache.recentEvents)
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

      // Single server action call for all dashboard data
      const dashboardData = await getFullAdminDashboard(6)

      // Update cache
      adminDashboardCache.stats = dashboardData.stats
      adminDashboardCache.monthlyStats = dashboardData.monthlyStats
      adminDashboardCache.alerts = dashboardData.alerts
      adminDashboardCache.recentEvents = dashboardData.recentEvents as RecentEvent[]
      adminDashboardCache.timestamp = now

      setStats(dashboardData.stats)
      setMonthlyStats(dashboardData.monthlyStats)
      setAlerts(dashboardData.alerts)
      setRecentEvents(dashboardData.recentEvents as RecentEvent[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch admin dashboard data'
      console.error('[useAdminDashboard] Error:', message)
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
    monthlyStats,
    alerts,
    recentEvents,
    loading,
    error,
    refetch: () => fetchData(true),
  }
}
