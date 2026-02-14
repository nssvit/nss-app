'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { CurrentUser } from '@/types'

const AUTH_TIMEOUT_MS = 10000

interface SignupUserData {
  firstName: string
  lastName: string
  rollNumber: string
  branch: string
  year: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  currentUser: CurrentUser | null
  loading: boolean
  authError: string | null
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (
    email: string,
    password: string,
    userData: SignupUserData
  ) => Promise<{ error: AuthError | null }>
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
  const isMountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchedUserIdRef = useRef<string | null>(null)

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
    lastFetchedUserIdRef.current = null
    window.location.reload()
  }, [])

  // Takes authUserId directly — avoids redundant getUser() network call
  // and prevents deadlock when called from onAuthStateChange.
  const fetchCurrentUser = useCallback(
    async (authUserId: string) => {
      try {
        if (!isMountedRef.current) return

        const { data: volunteerData, error: volunteerError } = await supabase
          .from('volunteers')
          .select('*')
          .eq('auth_user_id', authUserId)
          .eq('is_active', true)
          .single()

        if (volunteerError) {
          if (!isMountedRef.current) return
          if (volunteerError.code === 'PGRST116') {
            setAuthError('Your volunteer profile is being set up. Please wait and try again.')
          } else {
            setAuthError('Failed to load user data. Please try again.')
          }
          return
        }

        if (!volunteerData || !isMountedRef.current) return

        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role_definitions(role_name)')
          .eq('volunteer_id', volunteerData.id)
          .eq('is_active', true)

        const roles =
          rolesData
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join query returns untyped
            ?.map((ur: any) => ur.role_definitions?.role_name)
            .filter(Boolean) || ['volunteer']

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase returns untyped rows
        const vol = volunteerData as Record<string, any>
        if (isMountedRef.current) {
          setCurrentUser({
            volunteerId: vol.id,
            firstName: vol.first_name,
            lastName: vol.last_name,
            rollNumber: vol.roll_number,
            email: vol.email,
            branch: vol.branch,
            year: vol.year,
            phoneNo: vol.phone_no,
            birthDate: vol.birth_date,
            gender: vol.gender,
            nssJoinYear: vol.nss_join_year,
            address: vol.address,
            profilePic: vol.profile_pic,
            isActive: vol.is_active,
            roles: roles.length > 0 ? roles : ['volunteer'],
          })
          setAuthError(null)
        }
      } catch {
        if (isMountedRef.current) {
          setAuthError('Failed to load user data. Please try again.')
        }
      } finally {
        finishLoading()
      }
    },
    [supabase, finishLoading]
  )

  useEffect(() => {
    isMountedRef.current = true

    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && loading) {
        setAuthError('Authentication is taking longer than expected. Please refresh.')
        setLoading(false)
      }
    }, AUTH_TIMEOUT_MS)

    // Use getSession() for the initial session check.
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (!isMountedRef.current) return
        if (error) {
          setSession(null)
          setUser(null)
          finishLoading()
          return
        }
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        if (initialSession?.user) {
          lastFetchedUserIdRef.current = initialSession.user.id
          fetchCurrentUser(initialSession.user.id)
        } else {
          finishLoading()
        }
      })
      .catch(() => {
        if (!isMountedRef.current) return
        setAuthError('Network error. Please check your connection.')
        finishLoading()
      })

    // Listen for subsequent auth events (sign-in, sign-out, token refresh).
    // IMPORTANT: Do NOT await Supabase methods inside this callback —
    // it can deadlock the auth state machine (per Supabase docs).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMountedRef.current) return

      // Skip INITIAL_SESSION — already handled by getSession() above.
      if (event === 'INITIAL_SESSION') return

      // Session lost
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !newSession)) {
        setSession(null)
        setUser(null)
        setCurrentUser(null)
        lastFetchedUserIdRef.current = null
        finishLoading()
        return
      }

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        const userId = newSession.user.id
        // Only fetch profile when user changes (skip on TOKEN_REFRESHED, tab refocus, etc.)
        if (userId !== lastFetchedUserIdRef.current) {
          lastFetchedUserIdRef.current = userId
          // Dispatch via setTimeout to avoid deadlock —
          // Supabase docs: "Do not use other Supabase functions in the callback function"
          setTimeout(() => {
            fetchCurrentUser(userId)
          }, 0)
        }
      } else {
        setCurrentUser(null)
        finishLoading()
      }
    })

    return () => {
      isMountedRef.current = false
      clearTimeouts()
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ?? null }
  }

  const signUpWithEmail = async (email: string, password: string, userData: SignupUserData) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          roll_number: userData.rollNumber,
          branch: userData.branch,
          year: userData.year,
        },
      },
    })
    return { error: error ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
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
        user,
        session,
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
