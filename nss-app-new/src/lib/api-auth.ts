/**
 * API Route Auth Helpers
 *
 * Validates Bearer tokens for API routes (used by Flutter app).
 * Unlike auth-cache.ts (which uses React cache() + cookies for server actions),
 * these helpers parse the Authorization header for stateless API calls.
 */

import { auth } from '@/lib/auth'
import { queries } from '@/db/queries'
import { withRetry } from '@/db'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type ApiUser = {
  id: string
  email: string
}

type ApiVolunteer = {
  id: string
  authUserId: string | null
  firstName: string
  lastName: string
  email: string
  isActive: boolean | null
  roleNames: string[]
}

/**
 * Validate Bearer token from Authorization header.
 * Returns the authenticated user or throws ApiError(401).
 */
export async function getApiUser(request: Request): Promise<ApiUser> {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    throw new ApiError('Unauthorized: Invalid or expired token', 401)
  }

  return { id: session.user.id, email: session.user.email }
}

/**
 * Get the volunteer profile + roles for the authenticated user.
 * Throws 401 if not authenticated, 404 if no volunteer profile linked.
 */
export async function getApiVolunteer(request: Request): Promise<ApiVolunteer> {
  const user = await getApiUser(request)
  const volunteer = await withRetry(() => queries.getVolunteerWithRolesByAuthId(user.id))

  if (!volunteer) {
    throw new ApiError('Volunteer profile not found', 404)
  }

  return volunteer
}

/**
 * Require the user to have at least one of the specified roles.
 * Throws 403 if the user lacks all listed roles.
 */
export async function requireApiRole(
  request: Request,
  ...roles: string[]
): Promise<ApiVolunteer> {
  const volunteer = await getApiVolunteer(request)
  const hasRole = roles.some((r) => volunteer.roleNames.includes(r))

  if (!hasRole) {
    throw new ApiError(`Forbidden: Requires one of [${roles.join(', ')}]`, 403)
  }

  return volunteer
}

/**
 * Require the user to be an admin.
 */
export async function requireApiAdmin(request: Request): Promise<ApiVolunteer> {
  return requireApiRole(request, 'admin')
}
