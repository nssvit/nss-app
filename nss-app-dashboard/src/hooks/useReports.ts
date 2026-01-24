'use client'

/**
 * Reports Hook
 *
 * Fetches report data using Server Actions (Drizzle ORM)
 * Simplified from 102 LOC to ~70 LOC
 */

import { useState, useEffect, useCallback } from 'react'
import { getCategoryDistribution, getTopEventsByImpact } from '@/app/actions/reports'

export interface CategoryDistribution {
  categoryId: number
  categoryName: string
  eventCount: number
  colorHex: string | null
  participantCount: number
  totalHours: number
  // Snake_case aliases
  category_id?: number
  category_name?: string
  event_count?: number
  color_hex?: string | null
  participant_count?: number
  total_hours?: number
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
  // Snake_case aliases
  event_id?: string
  event_name?: string
  event_date?: Date | null
  category_name?: string
  participant_count?: number
  total_hours?: number
  impact_score?: number
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

      // Transform with snake_case aliases
      const categoryWithAliases = (categoryData || []).map((c: any) => ({
        ...c,
        category_id: c.categoryId,
        category_name: c.categoryName,
        event_count: c.eventCount,
        color_hex: c.colorHex,
        participant_count: c.participantCount,
        total_hours: c.totalHours,
      }))

      const eventsWithAliases = (eventsData || []).map((e: any) => ({
        ...e,
        event_id: e.eventId,
        event_name: e.eventName,
        event_date: e.eventDate,
        category_name: e.categoryName,
        participant_count: e.participantCount,
        total_hours: e.totalHours,
        impact_score: e.impactScore,
      }))

      setCategoryDistribution(categoryWithAliases)
      setTopEvents(eventsWithAliases)
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
