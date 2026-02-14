import { AdminDashboard } from '@/components/dashboard'
import { PageHeader } from '@/components/page-header'
import { requireAuthServer } from '@/lib/auth-server'
import { queries } from '@/db/queries'
import { mapTrendRow } from '@/lib/mappers'

export default async function DashboardPage() {
  await requireAuthServer()
  const [stats, trendRows] = await Promise.all([
    queries.getDashboardStats(),
    queries.getMonthlyActivityTrends(),
  ])
  const trends = trendRows.map(mapTrendRow)

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of NSS activities and metrics." />
      <AdminDashboard initialData={{ stats, trends }} />
    </div>
  )
}
