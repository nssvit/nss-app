import { requireApiAdmin } from '@/lib/api-auth'
import { apiSuccess, withApiHandler } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  await requireApiAdmin(request)
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') ?? undefined
  const limit = parseInt(searchParams.get('limit') ?? '100', 10)
  const logs = await queries.getAuditLogs(action, limit)
  return apiSuccess(logs)
})
