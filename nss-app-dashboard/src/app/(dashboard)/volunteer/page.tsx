'use client'

/**
 * Volunteer Dashboard Page
 * Default dashboard for all authenticated users
 */

import { VolunteerDashboard } from '@/components/dashboards/VolunteerDashboard'
import { useRouter } from 'next/navigation'

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
