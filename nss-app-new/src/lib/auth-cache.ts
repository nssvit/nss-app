/**
 * Auth Cache - Performance optimization for server actions
 *
 * Caches auth state within a single request lifecycle using React's cache()
 * This prevents multiple auth checks per request.
 *
 * OPTIMIZED: getCurrentVolunteer() now fetches volunteer + roles in a single
 * SQL query, eliminating the separate volunteerHasAnyRole() round-trip for
 * page-level auth checks.
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
  /** Pre-loaded role names — avoids a separate DB query for role checks */
  roleNames: string[]
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
 * Cached volunteer fetch with roles - only runs once per request.
 * Single SQL query returns volunteer data + role names together,
 * eliminating the need for a separate volunteerHasAnyRole() call.
 */
export const getCurrentVolunteer = cache(async (): Promise<CachedVolunteer> => {
  const user = await getAuthUser()
  const result = await withRetry(() => queries.getVolunteerWithRolesByAuthId(user.id))

  if (!result) {
    throw new Error('Volunteer profile not found')
  }

  return result
})

/**
 * Require current user to have at least one of the specified roles.
 * Uses pre-loaded roleNames from getCurrentVolunteer() — no extra DB query.
 */
export async function requireAnyRole(...roles: string[]): Promise<CachedVolunteer> {
  const volunteer = await getCurrentVolunteer()
  const hasRole = roles.some((r) => volunteer.roleNames.includes(r))
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
