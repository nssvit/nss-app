import { TabbedDashboard, VolunteerDashboard } from '@/components/dashboard'
import { PageHeader } from '@/components/page-header'
import { requireAuthServer } from '@/lib/auth-server'
import { getCurrentVolunteer } from '@/lib/auth-cache'
import { queries } from '@/db/queries'
import { mapTrendRow } from '@/lib/mappers'

export default async function DashboardPage() {
  await requireAuthServer()
  const volunteer = await getCurrentVolunteer()
  const isAdminOrHead = await queries.volunteerHasAnyRole(volunteer.id, ['admin', 'head'])

  if (isAdminOrHead) {
    const [stats, trendRows] = await Promise.all([
      queries.getDashboardStats(),
      queries.getMonthlyActivityTrends(),
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
