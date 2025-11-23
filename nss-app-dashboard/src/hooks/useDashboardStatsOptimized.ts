/**
 * Optimized Dashboard Statistics Hook
 * Uses Supabase Broadcast for <10ms realtime updates (vs 40-50ms with postgres_changes)
 *
 * Performance improvements:
 * - 4-5x faster realtime updates
 * - Better scalability for multiple users
 * - No RLS overhead on realtime events
 * - Direct message delivery
 *
 * Sources:
 * - https://supabase.com/docs/guides/realtime/benchmarks
 * - https://github.com/orgs/supabase/discussions/28853
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface DashboardStats {
  total_events: number
  active_volunteers: number
  total_hours: number
  ongoing_projects: number
}

export interface ActivityTrend {
  month: string
  month_number: number
  year_number: number
  events_count: number
  volunteers_count: number
  hours_sum: number
}

export interface RecentEvent {
  id: string
  name: string
  event_date: string | null
  start_date: string
  event_status: string
  category_id: number
  event_categories: {
    name: string
    color_hex: string | null
  } | null
  volunteers: {
    first_name: string
    last_name: string
  } | null
}

export interface UseDashboardStatsReturn {
  stats: DashboardStats | null
  activityData: ActivityTrend[]
  recentEvents: RecentEvent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastFetched: Date | null
  isCacheStale: boolean
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useDashboardStatsOptimized(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activityData, setActivityData] = useState<ActivityTrend[]>([])
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const isMountedRef = useRef(true)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const checkCacheStale = useCallback(() => {
    if (!lastFetched) return true
    const now = new Date()
    return now.getTime() - lastFetched.getTime() > CACHE_DURATION
  }, [lastFetched])

  const fetchDashboardData = useCallback(async (force = false) => {
    if (!force && !checkCacheStale() && stats !== null) {
      console.log('[useDashboardStats] Cache hit - using cached data')
      return
    }

    if (!isMountedRef.current) return

    try {
      setLoading(true)
      setError(null)

      console.log('[useDashboardStats] Fetching fresh data from database')

      // Fetch all data in parallel
      const [statsResult, trendsResult, eventsResult] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),
        supabase.rpc('get_monthly_activity_trends'),
        supabase
          .from('events')
          .select(
            `
            id,
            name,
            event_date,
            start_date,
            event_status,
            category_id,
            event_categories (
              name,
              color_hex
            ),
            volunteers:created_by_volunteer_id (
              first_name,
              last_name
            )
          `
          )
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      if (!isMountedRef.current) return

      // Handle stats
      if (statsResult.error) {
        if (
          statsResult.error.message?.includes('does not exist') ||
          statsResult.error.code === '42883'
        ) {
          throw new Error(
            'Database functions not found. Please run db/supabase_functions.sql in your Supabase SQL Editor.'
          )
        }
        throw new Error(statsResult.error.message || 'Failed to fetch dashboard statistics')
      }

      if (statsResult.data && statsResult.data.length > 0) {
        setStats(statsResult.data[0] as DashboardStats)
      }

      // Handle trends
      if (trendsResult.error) {
        if (
          trendsResult.error.message?.includes('does not exist') ||
          trendsResult.error.code === '42883'
        ) {
          throw new Error(
            'Database functions not found. Please run db/supabase_functions.sql in your Supabase SQL Editor.'
          )
        }
        throw new Error(trendsResult.error.message || 'Failed to fetch activity trends')
      }

      setActivityData((trendsResult.data || []) as ActivityTrend[])

      // Handle recent events
      if (eventsResult.error) {
        throw new Error(eventsResult.error.message || 'Failed to fetch recent events')
      }

      setRecentEvents((eventsResult.data || []) as RecentEvent[])
      setLastFetched(new Date())

      console.log('[useDashboardStats] Data cached successfully')
    } catch (err: any) {
      if (!isMountedRef.current) return

      const errorMessage = err?.message || 'Failed to fetch dashboard data'
      console.error('Error fetching dashboard stats:', errorMessage)
      setError(errorMessage)

      setStats(null)
      setActivityData([])
      setRecentEvents([])
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [checkCacheStale, stats])

  // Initial fetch
  useEffect(() => {
    fetchDashboardData(true)
  }, [fetchDashboardData])

  // Setup optimized Broadcast subscriptions (4-5x faster than postgres_changes)
  useEffect(() => {
    const handleBroadcastUpdate = (payload: any) => {
      console.log('[useDashboardStats] Broadcast update received:', payload)

      // Debounce updates to prevent excessive re-renders
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          fetchDashboardData(true)
        }
      }, 500) // 500ms debounce
    }

    // Create a single channel for all broadcasts
    const channel = supabase
      .channel('dashboard-broadcast')
      // Listen for events table changes
      .on('broadcast', { event: 'events-change' }, handleBroadcastUpdate)
      // Listen for participation changes
      .on('broadcast', { event: 'event_participation-change' }, handleBroadcastUpdate)
      // Listen for volunteer changes
      .on('broadcast', { event: 'volunteers-change' }, handleBroadcastUpdate)
      .subscribe((status) => {
        console.log('[useDashboardStats] Broadcast subscription status:', status)
      })

    channelRef.current = channel

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (channelRef.current) {
        console.log('[useDashboardStats] Cleaning up broadcast subscriptions')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchDashboardData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    stats,
    activityData,
    recentEvents,
    loading,
    error,
    refetch: () => fetchDashboardData(true),
    lastFetched,
    isCacheStale: checkCacheStale(),
  }
}
