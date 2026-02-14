'use client'

import { useState, useEffect } from 'react'
import type { DashboardStats, ActivityTrend, EventWithStats } from '@/types'
import { getDashboardStats, getMonthlyTrends } from '@/app/actions/reports'
import { getEvents } from '@/app/actions/events'

export function useReports() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trends, setTrends] = useState<ActivityTrend[]>([])
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, t, e] = await Promise.all([getDashboardStats(), getMonthlyTrends(), getEvents()])
        setStats(s)
        setTrends(t)
        setEvents(e)
      } catch (err) {
        console.error('Failed to load reports:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { stats, trends, events, loading }
}
