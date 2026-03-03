import { getApiUser, requireApiRole, ApiError } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request, { params }) => {
  await getApiUser(request)
  const { id } = await params
  const event = await queries.getEventById(id)

  if (!event) {
    throw new ApiError('Event not found', 404)
  }

  return apiSuccess(toSnakeCase(event))
})

export const PUT = withApiHandler(async (request, { params }) => {
  await requireApiRole(request, 'admin', 'head')
  const { id } = await params
  const body = await request.json()

  // Accept both snake_case and camelCase keys
  const updates: Record<string, unknown> = {}
  if (body.event_name ?? body.eventName) updates.eventName = body.event_name ?? body.eventName
  if (body.description !== undefined) updates.description = body.description
  if (body.start_date ?? body.startDate) updates.startDate = new Date(body.start_date ?? body.startDate)
  if (body.end_date ?? body.endDate) updates.endDate = new Date(body.end_date ?? body.endDate)
  if (body.declared_hours ?? body.declaredHours) updates.declaredHours = body.declared_hours ?? body.declaredHours
  if (body.category_id ?? body.categoryId) updates.categoryId = body.category_id ?? body.categoryId
  if (body.location !== undefined) updates.location = body.location
  if (body.max_participants !== undefined || body.maxParticipants !== undefined)
    updates.maxParticipants = body.max_participants ?? body.maxParticipants
  if (body.min_participants !== undefined || body.minParticipants !== undefined)
    updates.minParticipants = body.min_participants ?? body.minParticipants
  if (body.event_status ?? body.eventStatus) updates.eventStatus = body.event_status ?? body.eventStatus
  if (body.registration_deadline !== undefined || body.registrationDeadline !== undefined) {
    const val = body.registration_deadline ?? body.registrationDeadline
    updates.registrationDeadline = val ? new Date(val) : null
  }

  const result = await queries.updateEvent(id, updates)
  return apiSuccess(result)
})

export const DELETE = withApiHandler(async (request, { params }) => {
  await requireApiRole(request, 'admin', 'head')
  const { id } = await params
  const result = await queries.deleteEvent(id)
  return apiSuccess(result)
})
