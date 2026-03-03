import { requireApiRole } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const PATCH = withApiHandler(async (request, { params }) => {
  await requireApiRole(request, 'admin', 'head')
  const { id } = await params
  const body = await request.json()

  const result = await queries.updateParticipationStatus(id, {
    participationStatus: body.participation_status ?? body.participationStatus,
    hoursAttended: body.hours_attended ?? body.hoursAttended,
    notes: body.notes,
  })

  return apiSuccess(toSnakeCase(result))
})
