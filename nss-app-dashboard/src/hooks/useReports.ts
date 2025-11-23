/**
 * Reports Hook
 * Fetches and manages report data with parallel fetching
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

      // Fetch both reports data in parallel for better performance
      const [categoryResult, topEventsResult] = await Promise.all([
        supabase.rpc('get_category_distribution'),
        supabase.rpc('get_top_events_by_impact', { limit_count: 10 })
      ])

      // Handle category distribution result
      if (categoryResult.error) {
        if (categoryResult.error.message?.includes('does not exist') || categoryResult.error.code === '42883') {
          throw new Error(
            'Database functions not found. Please run db/supabase_functions.sql in your Supabase SQL Editor.'
          )
        }
        throw new Error(categoryResult.error.message || 'Failed to fetch category distribution')
      }

      // Handle top events result
      if (topEventsResult.error) {
        if (topEventsResult.error.message?.includes('does not exist') || topEventsResult.error.code === '42883') {
          throw new Error(
            'Database functions not found. Please run db/supabase_functions.sql in your Supabase SQL Editor.'
          )
        }
        throw new Error(topEventsResult.error.message || 'Failed to fetch top events')
      }

      setCategoryDistribution((categoryResult.data || []) as CategoryDistribution[])
      setTopEvents((topEventsResult.data || []) as TopEvent[])
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
  }, [])

  return {
    categoryDistribution,
    topEvents,
    loading,
    error,
    refetch: fetchReportsData,
  }
}
