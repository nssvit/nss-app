import { ProtectedRoute } from '@/components/auth/protected-route'
import { HoursPage } from '@/components/hours'

export default function HoursApprovalRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'program_officer', 'event_lead']}>
      <HoursPage />
    </ProtectedRoute>
  )
}
