import { ActivityLogsPage } from '@/components/activity-logs/activity-logs-page'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function ActivityLogsRoutePage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <ActivityLogsPage />
    </ProtectedRoute>
  )
}
