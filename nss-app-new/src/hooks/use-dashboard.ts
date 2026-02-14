'use client'

import { useState, useEffect } from 'react'
import type { DashboardStats, ActivityTrend } from '@/types'
import { getDashboardStats, getActivityTrends } from '@/lib/mock-api'

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trends, setTrends] = useState<ActivityTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [s, t] = await Promise.all([getDashboardStats(), getActivityTrends()])
      setStats(s)
      setTrends(t)
      setLoading(false)
    }
    load()
  }, [])

  return { stats, trends, loading }
}
