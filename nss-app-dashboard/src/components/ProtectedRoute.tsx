'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRoles?: string[]
  requireAnyRole?: string[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requireRoles = [],
  requireAnyRole = [],
  fallback
}: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (loading || !currentUser) {
      setHasAccess(false)
      return
    }

    // If no role requirements, just check if user is authenticated
    if (requireRoles.length === 0 && requireAnyRole.length === 0) {
      setHasAccess(true)
      return
    }

    // Check if user has all required roles
    if (requireRoles.length > 0) {
      const hasAllRoles = requireRoles.every(role =>
        currentUser.roles.includes(role)
      )
      if (!hasAllRoles) {
        setHasAccess(false)
        return
      }
    }

    // Check if user has any of the required roles
    if (requireAnyRole.length > 0) {
      const hasAnyRole = requireAnyRole.some(role =>
        currentUser.roles.includes(role)
      )
      if (!hasAnyRole) {
        setHasAccess(false)
        return
      }
    }

    setHasAccess(true)
  }, [currentUser, loading, requireRoles, requireAnyRole])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
          <p className="text-gray-400">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return fallback || (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-lock text-4xl text-gray-500 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Authentication Required</h2>
          <p className="text-gray-500">Please sign in to access this page.</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return fallback || (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-user-shield text-4xl text-gray-500 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Access Denied</h2>
          <p className="text-gray-500">
            You don't have the required permissions to access this page.
          </p>
          {requireRoles.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Required roles: {requireRoles.join(', ')}
            </p>
          )}
          {requireAnyRole.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Required: any of {requireAnyRole.join(', ')}
            </p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}