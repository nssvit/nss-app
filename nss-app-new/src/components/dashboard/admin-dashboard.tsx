'use client'

import type { DashboardStats, ActivityTrend } from '@/types'
import { useDashboard } from '@/hooks/use-dashboard'
import { StatsOverview } from './stats-overview'
import { ActivityChart } from './activity-chart'
import { RecentEvents } from './recent-events'
import { QuickActions } from './quick-actions'

interface AdminDashboardProps {
  initialData?: {
    stats: DashboardStats
    trends: ActivityTrend[]
  }
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const { stats, trends, loading } = useDashboard(initialData)

  return (
    <div className="space-y-6">
      <StatsOverview stats={stats} loading={loading} />

      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart trends={trends} loading={loading} />
        <RecentEvents />
      </div>
    </div>
  )
}
