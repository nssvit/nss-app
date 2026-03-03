import { requireApiRole, ApiError } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const POST = withApiHandler(async (request) => {
  const volunteer = await requireApiRole(request, 'admin', 'head')
  const body = await request.json()

  const eventId = body.event_id ?? body.eventId
  const volunteerIds = body.volunteer_ids ?? body.volunteerIds

  if (!eventId || !Array.isArray(volunteerIds)) {
    throw new ApiError('event_id and volunteer_ids[] are required')
  }

  // Check if this is a bulk mark with status or a simple sync
  if (body.status) {
    const result = await queries.bulkMarkAttendance({
      eventId,
      volunteerIds,
      status: body.status,
      hoursAttended: body.hours_attended ?? body.hoursAttended,
      notes: body.notes,
      recordedBy: volunteer.id,
    })
    return apiSuccess(toSnakeCase(result))
  }

  const result = await queries.syncEventAttendance(eventId, volunteerIds)
  return apiSuccess(toSnakeCase(result))
})
