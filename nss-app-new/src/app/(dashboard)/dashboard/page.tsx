import { AdminDashboard } from '@/components/dashboard'
import { PageHeader } from '@/components/page-header'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of NSS activities and metrics." />
      <AdminDashboard />
    </div>
  )
}
