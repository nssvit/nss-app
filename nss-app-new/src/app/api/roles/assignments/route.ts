import { requireApiAdmin, ApiError } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase, toSnakeCaseArray } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  await requireApiAdmin(request)
  const assignments = await queries.getAllUserRolesWithNames()
  return apiSuccess(toSnakeCaseArray(assignments))
})

export const POST = withApiHandler(async (request) => {
  const admin = await requireApiAdmin(request)
  const body = await request.json()

  const volunteerId = body.volunteer_id ?? body.volunteerId
  const roleDefinitionId = body.role_definition_id ?? body.roleDefinitionId

  if (!volunteerId || !roleDefinitionId) {
    throw new ApiError('volunteer_id and role_definition_id are required')
  }

  const expiresAt = body.expires_at ?? body.expiresAt
  const result = await queries.adminAssignRole(
    volunteerId,
    roleDefinitionId,
    admin.id,
    expiresAt ? new Date(expiresAt) : null
  )

  return apiSuccess(toSnakeCase(result), 201)
})
