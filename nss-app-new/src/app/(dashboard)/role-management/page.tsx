import { ProtectedRoute } from '@/components/auth/protected-route'
import { RoleManagementPage } from '@/components/roles'

export default function RoleManagementRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <RoleManagementPage />
    </ProtectedRoute>
  )
}
