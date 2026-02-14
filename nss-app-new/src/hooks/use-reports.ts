'use client'

import { useState, useEffect } from 'react'
import type { DashboardStats, ActivityTrend, EventWithStats } from '@/types'
import { getDashboardStats, getActivityTrends, getEvents } from '@/lib/mock-api'

export function useReports() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trends, setTrends] = useState<ActivityTrend[]>([])
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [s, t, e] = await Promise.all([getDashboardStats(), getActivityTrends(), getEvents()])
      setStats(s)
      setTrends(t)
      setEvents(e)
      setLoading(false)
    }
    load()
  }, [])

  return { stats, trends, events, loading }
}
