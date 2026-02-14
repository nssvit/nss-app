import { SettingsPage } from '@/components/settings'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function Page() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  )
}
