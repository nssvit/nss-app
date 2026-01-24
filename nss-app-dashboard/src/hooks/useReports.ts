'use client'

/**
 * Reports Hook
 *
 * Fetches report data using Server Actions (Drizzle ORM)
 * Simplified from 102 LOC to ~70 LOC
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getCategoryDistribution,
  getTopEventsByImpact,
} from '@/app/actions/reports'

export interface CategoryDistribution {
  categoryId: number
  categoryName: string
  eventCount: number
  colorHex: string | null
  participantCount: number
  totalHours: number
}

export interface TopEvent {
  eventId: string
  eventName: string
  eventDate: Date | null
  categoryName: string
  participantCount: number
  totalHours: number
  impactScore: number
  eventStatus: string
}

export interface UseReportsReturn {
  categoryDistribution: CategoryDistribution[]
  topEvents: TopEvent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useReports(): UseReportsReturn {
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([])
  const [topEvents, setTopEvents] = useState<TopEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReportsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch both reports in parallel
      const [categoryData, eventsData] = await Promise.all([
        getCategoryDistribution(),
        getTopEventsByImpact(10),
      ])

      setCategoryDistribution(categoryData as CategoryDistribution[])
      setTopEvents(eventsData as TopEvent[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reports data'
      console.error('[useReports] Error:', message)
      setError(message)
      setCategoryDistribution([])
      setTopEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  return {
    categoryDistribution,
    topEvents,
    loading,
    error,
    refetch: fetchReportsData,
  }
}
