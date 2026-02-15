'use client'

import type { DashboardStats, ActivityTrend } from '@/types'
import { useDashboard } from '@/hooks/use-dashboard'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsOverview } from './stats-overview'
import { RecentEvents } from './recent-events'

const ActivityChart = dynamic(() => import('./activity-chart').then(m => ({ default: m.ActivityChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[380px] rounded-xl" />,
})
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
