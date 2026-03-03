import { requireApiRole } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCaseArray } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  await requireApiRole(request, 'admin', 'head')
  const data = await queries.getVolunteerHoursSummary()
  return apiSuccess(toSnakeCaseArray(data))
})
