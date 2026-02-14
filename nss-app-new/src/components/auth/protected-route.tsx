'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  fallback?: string
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallback = '/dashboard',
}: ProtectedRouteProps) {
  const { currentUser, loading, hasAnyRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!currentUser) {
      router.replace('/login')
      return
    }

    if (allowedRoles && !hasAnyRole(allowedRoles)) {
      router.replace(fallback)
    }
  }, [currentUser, loading, allowedRoles, hasAnyRole, router, fallback])

  if (loading) return null

  if (!currentUser) return null

  if (allowedRoles && !hasAnyRole(allowedRoles)) return null

  return <>{children}</>
}
