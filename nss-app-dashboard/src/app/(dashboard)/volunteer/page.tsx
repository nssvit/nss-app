'use client'

/**
 * Volunteer Dashboard Page
 * Default dashboard for all authenticated users
 */

import { useRouter } from 'next/navigation'
import { VolunteerDashboard } from '@/components/dashboards/VolunteerDashboard'

export default function VolunteerDashboardPage() {
  const router = useRouter()

  const handleNavigate = (page: string) => {
    // Map page names to routes
    const routeMap: Record<string, string> = {
      'event-registration': '/volunteer/events',
      events: '/volunteer/events',
      profile: '/volunteer/profile',
    }

    const route = routeMap[page] || `/volunteer/${page}`
    router.push(route)
  }

  return <VolunteerDashboard onNavigate={handleNavigate} />
}
