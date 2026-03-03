import { getApiUser } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase } from '@/lib/api-response'
import { queries } from '@/db/queries'
import { withRetry } from '@/db'

export const GET = withApiHandler(async (request) => {
  const user = await getApiUser(request)
  const volunteer = await withRetry(() => queries.getVolunteerByAuthId(user.id))

  if (!volunteer) {
    // Return basic user info if no volunteer profile linked
    return apiSuccess({ auth_user_id: user.id, email: user.email, volunteer: null })
  }

  // Get roles separately
  const roles = await withRetry(() => queries.getVolunteerRoles(volunteer.id))
  const roleNames = roles.map((r) => r.roleDefinition?.roleName).filter(Boolean)

  return apiSuccess(toSnakeCase({
    ...volunteer,
    roles: roleNames,
  }))
})
