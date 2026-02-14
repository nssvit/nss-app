'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  total_events: number
  active_volunteers: number
  total_hours: number
  ongoing_projects: number
}

interface ActivityDataItem {
  month: string
  events_count: number
  volunteers_count: number
  hours_sum: number
}

interface EventCategory {
  name: string
  color_hex: string | null
}

interface EventVolunteer {
  first_name: string
  last_name: string
}

interface RecentEvent {
  id: string
  name: string
  event_date: string | null
  start_date: string
  event_status: string
  category_id: string | null
  // Supabase can return single object or array depending on relation
  event_categories: EventCategory | EventCategory[] | null
  volunteers: EventVolunteer | EventVolunteer[] | null
}

interface DashboardCache {
  stats: DashboardStats | null
  activityData: ActivityDataItem[]
  recentEvents: RecentEvent[]
  lastFetched: number | null
  loading: boolean
  error: string | null
}

interface DashboardCacheContextType {
  cache: DashboardCache
  fetchDashboardData: (forceRefresh?: boolean) => Promise<void>
  clearCache: () => void
}

const DashboardCacheContext = createContext<DashboardCacheContextType | undefined>(undefined)

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const initialCache: DashboardCache = {
  stats: null,
  activityData: [],
  recentEvents: [],
  lastFetched: null,
  loading: false,
  error: null,
}

export function DashboardCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<DashboardCache>(initialCache)

  const isCacheValid = useCallback(() => {
    if (!cache.lastFetched) return false
    return Date.now() - cache.lastFetched < CACHE_DURATION
  }, [cache.lastFetched])

  const fetchDashboardData = useCallback(
    async (forceRefresh = false) => {
      // If cache is valid and not forcing refresh, don't fetch
      if (!forceRefresh && isCacheValid() && cache.stats) {
        console.log('Using cached dashboard data')
        return
      }

      try {
        setCache((prev) => ({ ...prev, loading: true, error: null }))

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

        // Handle errors
        if (statsResult.error) throw statsResult.error
        if (trendsResult.error) throw trendsResult.error
        if (eventsResult.error) throw eventsResult.error

        // Update cache
        setCache({
          stats:
            statsResult.data && statsResult.data.length > 0
              ? statsResult.data[0]
              : {
                  total_events: 0,
                  active_volunteers: 0,
                  total_hours: 0,
                  ongoing_projects: 0,
                },
          activityData: trendsResult.data || [],
          recentEvents: eventsResult.data || [],
          lastFetched: Date.now(),
          loading: false,
          error: null,
        })

        console.log('Dashboard data fetched successfully')
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err)
        setCache((prev) => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch dashboard data',
        }))
      }
    },
    [isCacheValid, cache.stats]
  )

  const clearCache = useCallback(() => {
    setCache(initialCache)
  }, [])

  return (
    <DashboardCacheContext.Provider
      value={{
        cache,
        fetchDashboardData,
        clearCache,
      }}
    >
      {children}
    </DashboardCacheContext.Provider>
  )
}

export function useDashboardCache() {
  const context = useContext(DashboardCacheContext)
  if (!context) {
    throw new Error('useDashboardCache must be used within DashboardCacheProvider')
  }
  return context
}
