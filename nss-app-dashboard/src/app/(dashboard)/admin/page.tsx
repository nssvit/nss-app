'use client'

/**
 * Admin Dashboard Page
 * Only accessible to users with admin role
 */

import { AdminDashboard } from '@/components/dashboards/AdminDashboard'
import { ProtectedRoute } from '@/components/auth'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const router = useRouter()

  const handleNavigate = (page: string) => {
    // Map page names to routes
    const routeMap: Record<string, string> = {
      'user-management': '/admin/users',
      'role-management': '/admin/roles',
      categories: '/admin/categories',
      settings: '/admin/settings',
      events: '/officer/events',
      attendance: '/officer/attendance',
      reports: '/officer/reports',
    }

    const route = routeMap[page] || `/admin/${page}`
    router.push(route)
  }

  return (
    <ProtectedRoute requireRoles={['admin']}>
      <AdminDashboard onNavigate={handleNavigate} />
    </ProtectedRoute>
  )
}
