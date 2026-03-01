import { Suspense } from 'react'
import { TabbedDashboard, VolunteerDashboard } from '@/components/dashboard'
import { PageHeader } from '@/components/page-header'
import { StatCardsSkeleton, ChartSkeleton } from '@/components/loading-skeletons'
import { getCurrentVolunteer } from '@/lib/auth-cache'
import { mapTrendRow } from '@/lib/mappers'
import { getCachedDashboardStats, getCachedMonthlyTrends } from '@/lib/query-cache'

/** Async component that fetches and renders dashboard data */
async function AdminDashboardData() {
  const [stats, trendRows] = await Promise.all([
    getCachedDashboardStats(),
    getCachedMonthlyTrends(),
  ])
  const trends = trendRows.map(mapTrendRow)
  return <TabbedDashboard initialData={{ stats, trends }} />
}

function DashboardSkeleton() {
  return (
    <>
      <StatCardsSkeleton count={4} />
      <ChartSkeleton />
    </>
  )
}

export default async function DashboardPage() {
  const volunteer = await getCurrentVolunteer()
  const isAdminOrHead = volunteer.roleNames.some((r) => ['admin', 'head'].includes(r))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          isAdminOrHead
            ? 'Overview of NSS activities and metrics.'
            : 'Your volunteer activity and upcoming events.'
        }
      />
      {isAdminOrHead ? (
        <Suspense fallback={<DashboardSkeleton />}>
          <AdminDashboardData />
        </Suspense>
      ) : (
        <VolunteerDashboard />
      )}
    </div>
  )
}
