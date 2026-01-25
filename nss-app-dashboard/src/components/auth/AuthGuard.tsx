'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AuthForm } from './AuthForm'
import { useState, useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
}

// Show extended loading message after this many seconds
const EXTENDED_LOADING_THRESHOLD_MS = 5000

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, authError, isTimedOut, retryAuth } = useAuth()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showExtendedMessage, setShowExtendedMessage] = useState(false)
  const [loadingDots, setLoadingDots] = useState('')

  // Show extended loading message after threshold
  useEffect(() => {
    if (!loading) {
      setShowExtendedMessage(false)
      return
    }

    const timer = setTimeout(() => {
      setShowExtendedMessage(true)
    }, EXTENDED_LOADING_THRESHOLD_MS)

    return () => clearTimeout(timer)
  }, [loading])

  // Animate loading dots
  useEffect(() => {
    if (!loading) return

    const interval = setInterval(() => {
      setLoadingDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)

    return () => clearInterval(interval)
  }, [loading])

  // Show error/timeout state
  if (isTimedOut || authError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #070709 0%, #0c0c0e 50%, #131315 100%)',
        }}
      >
        <div className="flex flex-col items-center space-y-6 max-w-md px-6 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <h2 className="text-xl font-semibold text-gray-100">
            {isTimedOut ? 'Loading Timeout' : 'Authentication Issue'}
          </h2>

          {/* Error Message */}
          <p className="text-gray-400">
            {authError || 'Something went wrong while loading. Please try again.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={retryAuth}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh Page</span>
            </button>
            <button
              onClick={() => {
                // Sign out and clear any stale data
                window.localStorage.clear()
                window.location.href = '/'
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
            >
              Sign Out & Reset
            </button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500">
            If this problem persists, please contact support or try clearing your browser cache.
          </p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #070709 0%, #0c0c0e 50%, #131315 100%)',
        }}
      >
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>

          {/* Loading Text */}
          <p className="text-gray-400">Loading NSS Dashboard{loadingDots}</p>

          {/* Extended Loading Message */}
          {showExtendedMessage && (
            <div className="mt-4 text-center space-y-3">
              <p className="text-sm text-gray-500">This is taking longer than usual...</p>
              <button
                onClick={retryAuth}
                className="text-sm text-indigo-400 hover:text-indigo-300 underline transition-colors"
              >
                Click here to refresh
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show auth form if not logged in
  if (!user) {
    return (
      <AuthForm
        mode={authMode}
        onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
      />
    )
  }

  return <>{children}</>
}
