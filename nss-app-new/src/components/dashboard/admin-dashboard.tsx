'use client'

import { useDashboard } from '@/hooks/use-dashboard'
import { StatsOverview } from './stats-overview'
import { ActivityChart } from './activity-chart'
import { RecentEvents } from './recent-events'
import { QuickActions } from './quick-actions'

export function AdminDashboard() {
  const { stats, trends, loading } = useDashboard()

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
