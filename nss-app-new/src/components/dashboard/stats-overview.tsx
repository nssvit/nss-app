'use client'

import { Calendar, Users, Clock, Briefcase } from 'lucide-react'
import { StatsCard } from '@/components/stats-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '@/types'

interface StatsOverviewProps {
  stats: DashboardStats | null
  loading?: boolean
}

function StatsOverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-xl" />
      ))}
    </div>
  )
}

export function StatsOverview({ stats, loading }: StatsOverviewProps) {
  if (loading || !stats) {
    return <StatsOverviewSkeleton />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Events"
        value={stats.totalEvents}
        icon={Calendar}
        trend={{ value: 12, label: 'from last quarter' }}
      />
      <StatsCard
        title="Active Volunteers"
        value={stats.activeVolunteers}
        icon={Users}
        trend={{ value: 8, label: 'from last month' }}
      />
      <StatsCard
        title="Total Hours"
        value={stats.totalHours}
        icon={Clock}
        trend={{ value: 15, label: 'from last quarter' }}
      />
      <StatsCard
        title="Ongoing Projects"
        value={stats.ongoingProjects}
        icon={Briefcase}
        trend={{ value: -2, label: 'from last month' }}
      />
    </div>
  )
}
