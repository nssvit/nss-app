'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { CurrentUser } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  currentUser: CurrentUser | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signUpWithEmail: (email: string, password: string, userData: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  hasRole: (roleName: string) => boolean
  hasAnyRole: (roleNames: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session with error handling for stale tokens
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn('[Auth] Session error, clearing stale session:', error.message)
          // Clear any stale session data
          setSession(null)
          setUser(null)
          setCurrentUser(null)
          setLoading(false)
          return
        }
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          getCurrentUserData()
        }
        setLoading(false)
      })
      .catch((error) => {
        // Handle network errors (Failed to fetch) gracefully
        console.warn('[Auth] Network error during session check:', error.message)
        setSession(null)
        setUser(null)
        setCurrentUser(null)
        setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle token refresh failures
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('[Auth] Token refresh failed, clearing session')
          setSession(null)
          setUser(null)
          setCurrentUser(null)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await getCurrentUserData()
        } else {
          setCurrentUser(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getCurrentUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('[Auth] No authenticated user found')
        return
      }

      // Get volunteer data directly from Supabase
      const { data: volunteerData, error: volunteerError } = await supabase
        .from('volunteers')
        .select('*')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .single()

      if (volunteerError) {
        console.error('[Auth] Volunteer query error:', volunteerError)
        return
      }

      if (!volunteerData) {
        console.log('[Auth] No volunteer record found for user')
        return
      }

      // Get roles separately
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role_definitions(role_name)')
        .eq('volunteer_id', (volunteerData as any)?.id)
        .eq('is_active', true)

      const roles = rolesData?.map((ur: any) => ur.role_definitions?.role_name).filter(Boolean) || ['volunteer']

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
        roles: roles
      }

      setCurrentUser(currentUserData)
    } catch (error) {
      console.error('[Auth] Error fetching current user:', error)
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
          year: userData.year
        }
      }
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
  }

  const hasRole = (roleName: string): boolean => {
    return currentUser?.roles?.includes(roleName) ?? false
  }

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(role => currentUser?.roles?.includes(role)) ?? false
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      currentUser,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      hasRole,
      hasAnyRole
    }}>
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