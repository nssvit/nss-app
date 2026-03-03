import { getApiUser, requireApiAdmin, ApiError } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCase } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request, { params }) => {
  await getApiUser(request)
  const { id } = await params
  const volunteer = await queries.getVolunteerById(id)

  if (!volunteer) {
    throw new ApiError('Volunteer not found', 404)
  }

  return apiSuccess(toSnakeCase(volunteer))
})

export const PUT = withApiHandler(async (request, { params }) => {
  await requireApiAdmin(request)
  const { id } = await params
  const body = await request.json()
  const result = await queries.adminUpdateVolunteer(id, body)
  return apiSuccess(result)
})
