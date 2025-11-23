/**
 * Reports Hook
 * Fetches and manages report data with real-time updates
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { setupDebouncedSubscription } from '@/lib/supabase-realtime'

export interface CategoryDistribution {
  category_id: number
  category_name: string
  event_count: number
  color_hex: string
  participant_count: number
  total_hours: number
}

export interface TopEvent {
  event_id: string
  event_name: string
  event_date: string | null
  category_name: string
  participant_count: number
  total_hours: number
  impact_score: string
  event_status: string
}

export interface UseReportsReturn {
  categoryDistribution: CategoryDistribution[]
  topEvents: TopEvent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useReports(): UseReportsReturn {
  const [categoryDistribution, setCategoryDistribution] = useState<
    CategoryDistribution[]
  >([])
  const [topEvents, setTopEvents] = useState<TopEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch category distribution
      const { data: categoryData, error: categoryError } = await supabase.rpc(
        'get_category_distribution'
      )

      if (categoryError) {
        if (categoryError.message?.includes('does not exist') || categoryError.code === '42883') {
          throw new Error(
            'Database functions not found. Please run db/supabase_functions.sql in your Supabase SQL Editor.'
          )
        }
        throw new Error(categoryError.message || 'Failed to fetch category distribution')
      }

      setCategoryDistribution((categoryData || []) as CategoryDistribution[])

      // Fetch top events by impact
      const { data: topEventsData, error: topEventsError } = await supabase.rpc(
        'get_top_events_by_impact',
        { limit_count: 10 }
      )

      if (topEventsError) {
        if (topEventsError.message?.includes('does not exist') || topEventsError.code === '42883') {
          throw new Error(
            'Database functions not found. Please run db/supabase_functions.sql in your Supabase SQL Editor.'
          )
        }
        throw new Error(topEventsError.message || 'Failed to fetch top events')
      }

      setTopEvents((topEventsData || []) as TopEvent[])
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch reports data'
      console.error('Error fetching reports data:', errorMessage)
      setError(errorMessage)

      // Set empty data on error
      setCategoryDistribution([])
      setTopEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportsData()

    // Set up real-time subscriptions
    const cleanup = setupDebouncedSubscription(
      ['events', 'event_categories', 'event_participation'],
      () => {
        fetchReportsData()
      },
      1000
    )

    return cleanup
  }, [])

  return {
    categoryDistribution,
    topEvents,
    loading,
    error,
    refetch: fetchReportsData,
  }
}
