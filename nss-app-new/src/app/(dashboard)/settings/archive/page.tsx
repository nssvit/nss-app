import { ProtectedRoute } from '@/components/auth/protected-route'
import { TenureArchivePage } from '@/components/settings/archive'

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <TenureArchivePage />
    </ProtectedRoute>
  )
}
