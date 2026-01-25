'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { CurrentUser } from '@/types'
import { prefetchDashboardData, clearPrefetchCache } from '@/lib/data-prefetch'

// Auth loading timeout - prevents infinite loading states (reduced for better UX)
const AUTH_LOADING_TIMEOUT_MS = 15000 // 15 seconds
const AUTH_USER_DATA_TIMEOUT_MS = 8000 // 8 seconds for user data fetch

interface AuthContextType {
  user: User | null
  session: Session | null
  currentUser: CurrentUser | null
  loading: boolean
  authError: string | null
  isTimedOut: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signUpWithEmail: (email: string, password: string, userData: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  hasRole: (roleName: string) => boolean
  hasAnyRole: (roleNames: string[]) => boolean
  retryAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isTimedOut, setIsTimedOut] = useState(false)

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Clear loading timeout
  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }, [])

  // Set loading timeout to prevent infinite loading
  const setLoadingTimeout = useCallback(() => {
    clearLoadingTimeout()
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && loading) {
        console.warn(
          '[Auth] Loading timeout reached after',
          AUTH_LOADING_TIMEOUT_MS / 1000,
          'seconds'
        )
        setIsTimedOut(true)
        setLoading(false)
        setAuthError(
          'Authentication is taking longer than expected. Please try refreshing the page.'
        )
      }
    }, AUTH_LOADING_TIMEOUT_MS)
  }, [loading, clearLoadingTimeout])

  // Retry authentication
  const retryAuth = useCallback(() => {
    console.log('[Auth] Retrying authentication...')
    setAuthError(null)
    setIsTimedOut(false)
    setLoading(true)
    window.location.reload()
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    setLoadingTimeout()

    // Get initial session with error handling for stale tokens
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!isMountedRef.current) return

        if (error) {
          console.warn('[Auth] Session error, clearing stale session:', error.message)
          setSession(null)
          setUser(null)
          setCurrentUser(null)
          setLoading(false)
          clearLoadingTimeout()
          return
        }

        console.log('[Auth] Session retrieved:', session ? 'active' : 'none')
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          getCurrentUserData()
        } else {
          setLoading(false)
          clearLoadingTimeout()
        }
      })
      .catch((error) => {
        if (!isMountedRef.current) return
        console.warn('[Auth] Network error during session check:', error.message)
        setSession(null)
        setUser(null)
        setCurrentUser(null)
        setAuthError('Network error. Please check your connection.')
        setLoading(false)
        clearLoadingTimeout()
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMountedRef.current) return

      console.log('[Auth] Auth state changed:', event)

      // Handle token refresh failures
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('[Auth] Token refresh failed, clearing session')
        setSession(null)
        setUser(null)
        setCurrentUser(null)
        setLoading(false)
        clearLoadingTimeout()
        return
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await getCurrentUserData()
      } else {
        setCurrentUser(null)
        setLoading(false)
        clearLoadingTimeout()
      }
    })

    return () => {
      isMountedRef.current = false
      clearLoadingTimeout()
      subscription.unsubscribe()
    }
  }, [])

  const getCurrentUserData = async () => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('User data fetch timeout')), AUTH_USER_DATA_TIMEOUT_MS)
    })

    try {
      const fetchUserData = async () => {
        // Use Supabase client directly for reliability
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.log('[Auth] No authenticated user found')
          return null
        }

        console.log('[Auth] Fetching volunteer data for user:', user.id)

        // Get volunteer data first
        const { data: volunteerData, error: volunteerError } = await supabase
          .from('volunteers')
          .select('*')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single()

        if (volunteerError) {
          // Handle "no rows returned" gracefully - user might be new or deactivated
          if (volunteerError.code === 'PGRST116') {
            console.warn(
              '[Auth] No volunteer record found for user - may be a new user awaiting setup'
            )
            setAuthError(
              'Your volunteer profile is being set up. Please wait a moment and try again.'
            )
            return null
          }
          console.error('[Auth] Volunteer query error:', volunteerError)
          throw new Error(`Failed to fetch volunteer data: ${volunteerError.message}`)
        }

        if (!volunteerData) {
          console.log('[Auth] No volunteer record found for user')
          setAuthError('Volunteer profile not found. Please contact an administrator.')
          return null
        }

        console.log('[Auth] Volunteer data retrieved:', volunteerData.id)

        // Get roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role_definitions(role_name)')
          .eq('volunteer_id', volunteerData.id)
          .eq('is_active', true)

        if (rolesError) {
          console.warn('[Auth] Roles query error:', rolesError)
        }

        const roles = rolesData
          ?.map((ur: any) => ur.role_definitions?.role_name)
          .filter(Boolean) || ['volunteer']

        console.log('[Auth] User roles:', roles)

        const vol = volunteerData as any
        const currentUserData: CurrentUser = {
          volunteer_id: vol.id,
          first_name: vol.first_name,
          last_name: vol.last_name,
          roll_number: vol.roll_number,
          email: vol.email,
          branch: vol.branch,
          year: vol.year,
          phone_no: vol.phone_no,
          birth_date: vol.birth_date,
          gender: vol.gender,
          nss_join_year: vol.nss_join_year,
          address: vol.address,
          profile_pic: vol.profile_pic,
          is_active: vol.is_active,
          roles: roles.length > 0 ? roles : ['volunteer'],
        }

        return currentUserData
      }

      // Race between fetch and timeout
      const userData = await Promise.race([fetchUserData(), timeoutPromise])

      if (isMountedRef.current) {
        if (userData) {
          setCurrentUser(userData)
          setAuthError(null)
          // Prefetch dashboard data in the background
          prefetchDashboardData(userData.roles)
        }
        setLoading(false)
        clearLoadingTimeout()
      }
    } catch (error: any) {
      if (!isMountedRef.current) return

      console.error('[Auth] Error fetching current user:', error)

      if (error.message === 'User data fetch timeout') {
        setAuthError('Loading user data is taking too long. Please try refreshing.')
      } else {
        setAuthError('Failed to load user data. Please try again.')
      }
      setLoading(false)
      clearLoadingTimeout()
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUpWithEmail = async (email: string, password: string, userData: any) => {
    // Pass user data as metadata - the database trigger will handle volunteer creation
    // This works even before email confirmation because the trigger runs with SECURITY DEFINER
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          roll_number: userData.roll_number,
          branch: userData.branch,
          year: userData.year,
        },
      },
    })

    if (error) {
      console.error('Signup error:', error)
      return { error }
    }

    // The database trigger (handle_new_user) automatically:
    // 1. Creates the volunteer record from auth.users metadata
    // 2. Assigns the default 'volunteer' role
    // No need to manually insert - it's handled server-side with proper permissions

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    clearPrefetchCache() // Clear cached data on logout
  }

  const hasRole = (roleName: string): boolean => {
    return currentUser?.roles?.includes(roleName) ?? false
  }

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some((role) => currentUser?.roles?.includes(role)) ?? false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        currentUser,
        loading,
        authError,
        isTimedOut,
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
