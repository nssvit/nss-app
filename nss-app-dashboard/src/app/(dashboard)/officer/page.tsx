'use client'

/**
 * Officer Dashboard Page
 * Accessible to program officers, event leads, and documentation leads
 */

import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth'
import { HeadsDashboard } from '@/components/dashboards/HeadsDashboard'

export default function OfficerDashboardPage() {
  const router = useRouter()

  const handleNavigate = (page: string) => {
    // Map page names to routes
    const routeMap: Record<string, string> = {
      events: '/officer/events',
      attendance: '/officer/attendance',
      'hours-approval': '/officer/hours',
      reports: '/officer/reports',
      volunteers: '/officer/volunteers',
    }

    const route = routeMap[page] || `/officer/${page}`
    router.push(route)
  }

  return (
    <ProtectedRoute
      requireAnyRole={['admin', 'program_officer', 'event_lead', 'documentation_lead']}
    >
      <HeadsDashboard onNavigate={handleNavigate} />
    </ProtectedRoute>
  )
}
