import { getApiVolunteer, ApiError } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCaseArray } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request, { params }) => {
  const volunteer = await getApiVolunteer(request)
  const { id } = await params

  // Allow self-access or admin access
  const isSelf = volunteer.id === id
  const isAdmin = volunteer.roleNames.includes('admin')

  if (!isSelf && !isAdmin) {
    throw new ApiError('Forbidden: Can only view your own participation history', 403)
  }

  const history = await queries.getVolunteerParticipationHistory(id)
  return apiSuccess(toSnakeCaseArray(history))
})
