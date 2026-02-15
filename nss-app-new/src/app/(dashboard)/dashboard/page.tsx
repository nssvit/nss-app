import { TabbedDashboard, VolunteerDashboard } from '@/components/dashboard'
import { PageHeader } from '@/components/page-header'
import { getCurrentVolunteer } from '@/lib/auth-cache'
import { queries } from '@/db/queries'
import { withRetry } from '@/db'
import { mapTrendRow } from '@/lib/mappers'
import { getCachedDashboardStats, getCachedMonthlyTrends } from '@/lib/query-cache'

export default async function DashboardPage() {
  const volunteer = await getCurrentVolunteer()
  const isAdminOrHead = await withRetry(() => queries.volunteerHasAnyRole(volunteer.id, ['admin', 'head']))

  if (isAdminOrHead) {
    const [stats, trendRows] = await Promise.all([
      getCachedDashboardStats(),
      getCachedMonthlyTrends(),
    ])
    const trends = trendRows.map(mapTrendRow)

    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of NSS activities and metrics." />
        <TabbedDashboard initialData={{ stats, trends }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your volunteer activity and upcoming events." />
      <VolunteerDashboard />
    </div>
  )
}
