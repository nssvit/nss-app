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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        getCurrentUserData()
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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

    return () => subscription.unsubscribe()
  }, [])

  const getCurrentUserData = async () => {
    try {
      console.log('Fetching current user data...')
      const { data, error } = await supabase.rpc('get_current_volunteer') as { data: CurrentUser[] | null; error: any }

      if (error) {
        console.error('RPC Error:', error)

        // If function doesn't exist, try direct query as fallback
        if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          console.log('Function not found, trying direct query fallback...')
          await getCurrentUserDataFallback()
        }
        return
      }

      console.log('RPC Response:', data)
      if (Array.isArray(data) && data.length > 0) {
        setCurrentUser(data[0])
        console.log('Current user set:', data[0])
      } else {
        console.log('No user data returned from RPC')
      }
    } catch (error) {
      console.error('Unexpected error fetching current user:', error)
      // Try fallback method
      await getCurrentUserDataFallback()
    }
  }

  const getCurrentUserDataFallback = async () => {
    try {
      console.log('Using fallback method to get current user...')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('No authenticated user found')
        return
      }

      // Get volunteer data directly with simplified query
      const { data: volunteerData, error: volunteerError } = await supabase
        .from('volunteers')
        .select('*')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .single()

      if (volunteerError) {
        console.error('Fallback volunteer query error:', volunteerError)
        return
      }

      // Get roles separately
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role_definitions(role_name)')
        .eq('volunteer_id', (volunteerData as any)?.id)
        .eq('is_active', true)

      const roles = rolesData?.map((ur: any) => ur.role_definitions?.role_name).filter(Boolean) || ['volunteer']

      if (volunteerData) {
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
        console.log('Fallback method successful:', currentUserData)
      }
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError)
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) return { error }

    // If signup successful and user confirmed, create volunteer record
    if (data.user && !error) {
      // First check if volunteer record already exists
      const { data: existingVolunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .maybeSingle() // Use maybeSingle() instead of single() to handle 0 results gracefully

      let volunteerData
      let volunteerError

      if (existingVolunteer) {
        // Volunteer record already exists, use it
        console.log('Volunteer record already exists, using existing record')
        volunteerData = [existingVolunteer]
        volunteerError = null
      } else {
        // Create new volunteer record
        const result = await supabase
          .from('volunteers')
          .insert({
            auth_user_id: data.user.id,
            email: email,
            ...userData
          })
          .select()

        volunteerData = result.data
        volunteerError = result.error

        if (volunteerError) {
          console.error('Error creating volunteer record:', volunteerError)
          console.error('Volunteer Error Details:', {
            message: volunteerError.message,
            details: volunteerError.details,
            hint: volunteerError.hint,
            code: volunteerError.code
          })
          console.error('User Data being inserted:', { auth_user_id: data.user.id, email, ...userData })
          return { error: volunteerError }
        }
      }

      // Assign default 'volunteer' role to new user
      if (volunteerData && volunteerData.length > 0) {
        const volunteerId = (volunteerData[0] as any).id

        // Get the volunteer role definition
        const { data: roleData, error: roleError } = await supabase
          .from('role_definitions')
          .select('id')
          .eq('role_name', 'volunteer')
          .eq('is_active', true)
          .maybeSingle()

        if (roleError) {
          console.error('Error fetching volunteer role:', roleError)
          return { error: roleError }
        }

        if (roleData) {
          // Assign the volunteer role
          const { error: userRoleError } = await supabase
            .from('user_roles')
            .insert({
              volunteer_id: volunteerId,
              role_definition_id: (roleData as any).id,
              is_active: true
            } as any)

          if (userRoleError) {
            console.error('Error assigning volunteer role:', userRoleError)
            return { error: userRoleError }
          }
        }
      }
    }

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