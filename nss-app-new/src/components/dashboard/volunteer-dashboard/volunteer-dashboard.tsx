'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import type { EventParticipationWithEvent } from '@/types'
import { getVolunteerDashboardData } from '@/app/actions/volunteers'
import dynamic from 'next/dynamic'
import { RecentEvents } from './recent-events'

const CategoryChart = dynamic(() => import('./category-chart').then(m => ({ default: m.CategoryChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] rounded-xl" />,
})
const MonthlyChart = dynamic(() => import('./monthly-chart').then(m => ({ default: m.MonthlyChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] rounded-xl" />,
})

function VolunteerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  )
}

export function VolunteerDashboard() {
  const [stats, setStats] = useState<{
    totalHours: number
    approvedHours: number
    eventsParticipated: number
    pendingReviews: number
  } | null>(null)
  const [participation, setParticipation] = useState<EventParticipationWithEvent[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action returns untyped events
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getVolunteerDashboardData()
        setStats(data.stats)
        setParticipation(data.participation || [])
        setUpcomingEvents(data.availableEvents || [])
      } catch (err) {
        console.error('Failed to load volunteer dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Aggregate hours by category for donut chart (skip rejected)
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {}
    for (const p of participation) {
      if (p.approvalStatus === 'rejected') continue
      const cat = p.categoryName || 'Other'
      const hours = p.approvalStatus === 'approved' ? (p.approvedHours ?? 0) : (p.hoursAttended ?? 0)
      grouped[cat] = (grouped[cat] || 0) + hours
    }
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
  }, [participation])

  // Aggregate hours by month for bar chart (skip rejected)
  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {}
    for (const p of participation) {
      if (p.approvalStatus === 'rejected' || !p.startDate) continue
      const d = new Date(p.startDate)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const hours = p.approvalStatus === 'approved' ? (p.approvedHours ?? 0) : (p.hoursAttended ?? 0)
      grouped[key] = (grouped[key] || 0) + hours
    }
    // Sort chronologically
    return Object.entries(grouped)
      .map(([month, hours]) => ({ month, hours }))
      .sort((a, b) => {
        const parse = (m: string) => new Date(`1 ${m}`)
        return parse(a.month).getTime() - parse(b.month).getTime()
      })
  }, [participation])

  if (loading) {
    return <VolunteerDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Events Participated"
          value={stats?.eventsParticipated ?? 0}
          icon={Calendar}
        />
        <StatsCard title="Hours Logged" value={stats?.totalHours ?? 0} icon={Clock} />
        <StatsCard title="Approved Hours" value={stats?.approvedHours ?? 0} icon={CheckCircle} />
        <StatsCard title="Pending Reviews" value={stats?.pendingReviews ?? 0} icon={AlertCircle} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryChart data={categoryData} />
        <MonthlyChart data={monthlyData} />
      </div>

      <RecentEvents participation={participation} upcomingEvents={upcomingEvents} />
    </div>
  )
}
