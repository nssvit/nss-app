'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { authClient } from '@/lib/auth-client'
import { fetchCurrentUserProfile } from '@/app/actions/auth'
import type { CurrentUser } from '@/types'

const AUTH_TIMEOUT_MS = 10000

interface AuthContextType {
  currentUser: CurrentUser | null
  loading: boolean
  authError: string | null
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (
    email: string,
    password: string,
    userData: SignupUserData
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  hasRole: (roleName: string) => boolean
  hasAnyRole: (roleNames: string[]) => boolean
  retryAuth: () => void
}

interface SignupUserData {
  firstName: string
  lastName: string
  rollNumber: string
  branch: string
  year: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const finishLoading = useCallback(() => {
    clearTimeouts()
    if (isMountedRef.current) setLoading(false)
  }, [clearTimeouts])

  const retryAuth = useCallback(() => {
    setAuthError(null)
    setLoading(true)
    window.location.reload()
  }, [])

  const loadProfile = useCallback(async () => {
    try {
      const profile = await fetchCurrentUserProfile()
      if (!isMountedRef.current) return

      if (profile) {
        setCurrentUser(profile)
        setAuthError(null)
      } else {
        setAuthError('Your volunteer profile is being set up. Please wait and try again.')
      }
    } catch {
      if (isMountedRef.current) {
        setAuthError('Failed to load user data. Please try again.')
      }
    } finally {
      finishLoading()
    }
  }, [finishLoading])

  useEffect(() => {
    isMountedRef.current = true

    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && loading) {
        setAuthError('Authentication is taking longer than expected. Please refresh.')
        setLoading(false)
      }
    }, AUTH_TIMEOUT_MS)

    // Check for existing session on mount
    authClient.getSession().then(({ data }) => {
      if (!isMountedRef.current) return
      if (data?.session) {
        loadProfile()
      } else {
        finishLoading()
      }
    }).catch(() => {
      if (!isMountedRef.current) return
      setAuthError('Network error. Please check your connection.')
      finishLoading()
    })

    return () => {
      isMountedRef.current = false
      clearTimeouts()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password })
    if (error) {
      return { error: error.message ?? 'Sign in failed' }
    }
    // Load profile after successful sign in
    await loadProfile()
    return { error: null }
  }

  const signUpWithEmail = async (email: string, password: string, userData: SignupUserData) => {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: `${userData.firstName} ${userData.lastName}`,
    })
    if (error) {
      return { error: error.message ?? 'Sign up failed' }
    }
    return { error: null }
  }

  const signOut = async () => {
    await authClient.signOut()
    setCurrentUser(null)
    window.location.href = '/login'
  }

  const hasRole = (roleName: string): boolean => {
    return currentUser?.roles?.includes(roleName) ?? false
  }

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some((role) => currentUser?.roles?.includes(role))
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authError,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        hasRole,
        hasAnyRole,
        retryAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
