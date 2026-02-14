import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserManagementPage } from '@/components/users'

export default function UserManagementRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <UserManagementPage />
    </ProtectedRoute>
  )
}
