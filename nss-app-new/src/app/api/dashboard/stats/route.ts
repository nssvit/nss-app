import { getApiUser } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  await getApiUser(request)
  const stats = await queries.getDashboardStats()
  return apiSuccess(toSnakeCase(stats))
})
