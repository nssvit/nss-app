import { ProtectedRoute } from '@/components/auth/protected-route'
import { AttendanceManager } from '@/components/attendance'

export default function AttendanceManagerRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'head']}>
      <AttendanceManager />
    </ProtectedRoute>
  )
}
