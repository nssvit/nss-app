import { ReportsPage } from '@/components/reports'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'head']}>
      <ReportsPage />
    </ProtectedRoute>
  )
}
