import { requireApiAdmin, ApiError } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase } from '@/lib/api-response'
import { queries } from '@/db/queries'
import { db } from '@/db'
import { userRoles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const DELETE = withApiHandler(async (request, { params }) => {
  await requireApiAdmin(request)
  const { id } = await params

  // Look up the user_role record to get volunteerId and roleDefinitionId
  const [record] = await db.select().from(userRoles).where(eq(userRoles.id, id))

  if (!record) {
    throw new ApiError('Role assignment not found', 404)
  }

  const result = await queries.adminRevokeRole(record.volunteerId, record.roleDefinitionId)
  return apiSuccess(toSnakeCase(result))
})
