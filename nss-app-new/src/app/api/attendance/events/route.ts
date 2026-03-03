import { requireApiRole } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCaseArray } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  await requireApiRole(request, 'admin', 'head')
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  const events = await queries.getEventsForAttendance(limit)
  return apiSuccess(toSnakeCaseArray(events))
})
