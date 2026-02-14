/**
 * Auth Cache - Performance optimization for server actions
 *
 * Caches auth state within a single request lifecycle using React's cache()
 * This prevents multiple auth checks per request.
 */

import { cache } from 'react'
import { queries } from '@/db/queries'
import { createClient } from '@/utils/supabase/server'

export type CachedUser = {
  id: string
  email?: string
}

export type CachedVolunteer = {
  id: string
  authUserId: string | null
  firstName: string
  lastName: string
  email: string
  isActive: boolean | null
}

/**
 * Cached auth check - only runs once per request
 * Uses React's cache() to deduplicate within the same render
 */
export const getAuthUser = cache(async (): Promise<CachedUser> => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Please sign in')
  }

  return { id: user.id, email: user.email }
})

/**
 * Cached volunteer fetch - only runs once per request
 */
export const getCurrentVolunteer = cache(async (): Promise<CachedVolunteer> => {
  const user = await getAuthUser()
  const volunteer = await queries.getVolunteerByAuthId(user.id)

  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }

  return {
    id: volunteer.id,
    authUserId: volunteer.authUserId,
    firstName: volunteer.firstName,
    lastName: volunteer.lastName,
    email: volunteer.email,
    isActive: volunteer.isActive,
  }
})

/**
 * Check if current user is admin - cached
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  try {
    const volunteer = await getCurrentVolunteer()
    return queries.isVolunteerAdmin(volunteer.id)
  } catch {
    return false
  }
})

/**
 * Optional auth - returns null if not authenticated
 */
export const getOptionalAuthUser = cache(async (): Promise<CachedUser | null> => {
  try {
    return await getAuthUser()
  } catch {
    return null
  }
})
