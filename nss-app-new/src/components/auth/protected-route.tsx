'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  fallback?: string
}

function ProtectedRouteSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
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

  // Show skeleton instead of null — prevents blank flash
  if (loading) return <ProtectedRouteSkeleton />

  if (!currentUser) return null

  if (allowedRoles && !hasAnyRole(allowedRoles)) return null

  return <>{children}</>
}
