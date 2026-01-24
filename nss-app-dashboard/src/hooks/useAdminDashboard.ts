'use client'

/**
 * Admin Dashboard Hook
 *
 * Fetches admin dashboard stats using Server Actions (Drizzle ORM)
 */

import { useState, useEffect, useCallback } from 'react'
import { getAdminDashboardStats, getRecentEvents } from '@/app/actions/dashboard'

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
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [alerts, setAlerts] = useState<Alerts | null>(null)
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel using Server Actions
      const [dashboardData, eventsData] = await Promise.all([
        getAdminDashboardStats(),
        getRecentEvents(6),
      ])

      setStats(dashboardData.stats)
      setMonthlyStats(dashboardData.monthlyStats)
      setAlerts(dashboardData.alerts)
      setRecentEvents(eventsData as RecentEvent[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch admin dashboard data'
      console.error('[useAdminDashboard] Error:', message)
      setError(message)
      setStats(null)
      setMonthlyStats(null)
      setAlerts(null)
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
    monthlyStats,
    alerts,
    recentEvents,
    loading,
    error,
    refetch: fetchData,
  }
}
