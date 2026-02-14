'use client'

import { useState, useEffect } from 'react'
import type { DashboardStats, ActivityTrend, EventWithStats } from '@/types'
import { getDashboardStats, getMonthlyTrends } from '@/app/actions/dashboard'
import { getEvents } from '@/app/actions/events'

export function useReports() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trends, setTrends] = useState<ActivityTrend[]>([])
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const [s, t, e] = await Promise.all([getDashboardStats(), getMonthlyTrends(), getEvents()])
        if (!ignore) {
          setStats(s)
          setTrends(t)
          setEvents(e)
        }
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        console.error('Failed to load reports:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  return { stats, trends, events, loading }
}
