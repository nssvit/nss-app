import { getApiUser } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCaseArray } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  await getApiUser(request)
  const trends = await queries.getMonthlyActivityTrends()
  return apiSuccess(toSnakeCaseArray(trends))
})
