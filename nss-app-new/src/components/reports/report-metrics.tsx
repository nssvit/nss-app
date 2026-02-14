'use client'

import { Calendar, Users, Clock, Briefcase } from 'lucide-react'
import { StatsCard } from '@/components/stats-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '@/types'

interface ReportMetricsProps {
  stats: DashboardStats | null
  loading?: boolean
}

function ReportMetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-xl" />
      ))}
    </div>
  )
}

export function ReportMetrics({ stats, loading }: ReportMetricsProps) {
  if (loading || !stats) {
    return <ReportMetricsSkeleton />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard title="Total Events" value={stats.totalEvents} icon={Calendar} />
      <StatsCard title="Active Volunteers" value={stats.activeVolunteers} icon={Users} />
      <StatsCard title="Total Hours" value={stats.totalHours} icon={Clock} />
      <StatsCard title="Ongoing Projects" value={stats.ongoingProjects} icon={Briefcase} />
    </div>
  )
}
