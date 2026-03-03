import { getApiUser } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCaseArray } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request, { params }) => {
  await getApiUser(request)
  const { id } = await params
  const participants = await queries.getEventParticipants(id)
  return apiSuccess(toSnakeCaseArray(participants))
})
