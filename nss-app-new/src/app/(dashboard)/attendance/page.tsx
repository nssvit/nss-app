import { AttendancePage } from '@/components/attendance'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function AttendanceRoutePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'head']}>
      <AttendancePage />
    </ProtectedRoute>
  )
}
