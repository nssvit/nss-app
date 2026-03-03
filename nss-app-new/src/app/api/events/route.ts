import { getApiVolunteer, requireApiRole, ApiError } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase, toSnakeCaseArray } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  const volunteer = await getApiVolunteer(request)
  const events = await queries.getEventsWithStats(volunteer.id)
  return apiSuccess(toSnakeCaseArray(events))
})

export const POST = withApiHandler(async (request) => {
  const volunteer = await requireApiRole(request, 'admin', 'head')
  const body = await request.json()

  if (!body.event_name && !body.eventName) {
    throw new ApiError('event_name is required')
  }

  const result = await queries.createEvent(
    {
      eventName: body.event_name ?? body.eventName,
      description: body.description,
      startDate: new Date(body.start_date ?? body.startDate),
      endDate: new Date(body.end_date ?? body.endDate),
      declaredHours: body.declared_hours ?? body.declaredHours,
      categoryId: body.category_id ?? body.categoryId,
      location: body.location,
      maxParticipants: body.max_participants ?? body.maxParticipants,
      minParticipants: body.min_participants ?? body.minParticipants,
      registrationDeadline: body.registration_deadline
        ? new Date(body.registration_deadline)
        : body.registrationDeadline
          ? new Date(body.registrationDeadline)
          : null,
      eventStatus: body.event_status ?? body.eventStatus,
    },
    volunteer.id,
    body.volunteer_ids ?? body.volunteerIds
  )

  return apiSuccess(toSnakeCase(result), 201)
})
