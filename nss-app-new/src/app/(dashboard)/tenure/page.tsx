import { ProtectedRoute } from '@/components/auth/protected-route'
import { TenurePage } from '@/components/tenure'

export default function TenureRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <TenurePage />
    </ProtectedRoute>
  )
}
