import { ProtectedRoute } from '@/components/auth/protected-route'
import { HoursPage } from '@/components/hours'

export default function AttendanceRoutePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'head']}>
      <HoursPage />
    </ProtectedRoute>
  )
}
