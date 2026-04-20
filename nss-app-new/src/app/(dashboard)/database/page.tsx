import { ProtectedRoute } from '@/components/auth/protected-route'
import { PageHeader } from '@/components/page-header'
import { DatabaseSettings } from '@/components/settings/database-settings'

export default function DatabaseRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        <PageHeader
          title="Database"
          description="Manage database failover and provider switching between Neon and Supabase."
        />
        <DatabaseSettings />
      </div>
    </ProtectedRoute>
  )
}
