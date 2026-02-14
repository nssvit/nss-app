import { ProtectedRoute } from '@/components/auth/protected-route'
import { HoursPage } from '@/components/hours'

export default function HoursApprovalRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'head']}>
      <HoursPage />
    </ProtectedRoute>
  )
}
