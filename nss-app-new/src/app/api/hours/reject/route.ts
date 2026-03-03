import { requireApiRole, ApiError } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const POST = withApiHandler(async (request) => {
  const volunteer = await requireApiRole(request, 'admin', 'head')
  const body = await request.json()

  const participationId = body.participation_id ?? body.participationId
  if (!participationId) {
    throw new ApiError('participation_id is required')
  }

  const result = await queries.rejectHoursTransaction(
    participationId,
    volunteer.id,
    body.notes
  )

  return apiSuccess(toSnakeCase(result))
})
