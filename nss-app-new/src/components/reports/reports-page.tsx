'use client'

import { PageHeader } from '@/components/page-header'
import { useReports } from '@/hooks/use-reports'
import { ReportMetrics } from './report-metrics'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const MonthlyTrends = dynamic(() => import('./monthly-trends').then(m => ({ default: m.MonthlyTrends })), {
  ssr: false,
  loading: () => <Skeleton className="h-[380px] rounded-xl" />,
})
const CategoryChart = dynamic(() => import('./category-chart').then(m => ({ default: m.CategoryChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[380px] rounded-xl" />,
})
import { TopEventsTable } from './top-events-table'
import { ExportButton } from './export-button'

export function ReportsPage() {
  const { stats, trends, events, loading } = useReports()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analytics and reports overview."
        actions={<ExportButton />}
      />

      <ReportMetrics stats={stats} loading={loading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyTrends trends={trends} loading={loading} />
        <CategoryChart events={events} loading={loading} />
      </div>

      <TopEventsTable events={events} loading={loading} />
    </div>
  )
}
