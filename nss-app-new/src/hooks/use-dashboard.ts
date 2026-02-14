'use client'

import { useState, useEffect } from 'react'
import type { DashboardStats, ActivityTrend } from '@/types'
import { getDashboardStats, getMonthlyTrends } from '@/app/actions/dashboard'

interface DashboardInitialData {
  stats: DashboardStats
  trends: ActivityTrend[]
}

export function useDashboard(initialData?: DashboardInitialData) {
  const [stats, setStats] = useState<DashboardStats | null>(initialData?.stats ?? null)
  const [trends, setTrends] = useState<ActivityTrend[]>(initialData?.trends ?? [])
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) return
    let ignore = false
    async function load() {
      try {
        const [s, t] = await Promise.all([getDashboardStats(), getMonthlyTrends()])
        if (!ignore) {
          setStats(s)
          setTrends(t)
        }
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [initialData])

  return { stats, trends, loading }
}
