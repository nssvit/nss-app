import { requireApiAdmin } from '@/lib/api-auth'
import { apiSuccess, withApiHandler } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  await requireApiAdmin(request)
  const actions = await queries.getDistinctAuditActions()
  return apiSuccess(actions)
})
