/**
 * Auth Cache - Performance optimization for server actions
 *
 * Caches auth state within a single request lifecycle using React's cache()
 * This prevents multiple auth checks per request.
 */

import { cache } from 'react'
import { queries } from '@/db/queries'
import { withRetry } from '@/db'
import { createClient } from '@/lib/supabase/server'

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
 * Wrapped with retry for transient connection failures to remote pooler.
 */
export const getCurrentVolunteer = cache(async (): Promise<CachedVolunteer> => {
  const user = await getAuthUser()
  const volunteer = await withRetry(() => queries.getVolunteerByAuthId(user.id))

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
 * Require current user to have at least one of the specified roles.
 * Throws if unauthorized. Returns the cached volunteer.
 */
export async function requireAnyRole(...roles: string[]): Promise<CachedVolunteer> {
  const volunteer = await getCurrentVolunteer()
  const hasRole = await withRetry(() => queries.volunteerHasAnyRole(volunteer.id, roles))
  if (!hasRole) {
    throw new Error(`Unauthorized: Requires one of [${roles.join(', ')}]`)
  }
  return volunteer
}

/**
 * Require current user to be an admin. Throws if not.
 */
export async function requireAdmin(): Promise<CachedVolunteer> {
  return requireAnyRole('admin')
}
