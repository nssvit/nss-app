import { EventRegistration } from '@/components/events'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function EventRegistrationRoute() {
  return (
    <ProtectedRoute>
      <EventRegistration />
    </ProtectedRoute>
  )
}
