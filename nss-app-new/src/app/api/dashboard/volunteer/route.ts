import { getApiVolunteer } from '@/lib/api-auth'
import { apiSuccess, withApiHandler, toSnakeCaseArray } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const GET = withApiHandler(async (request) => {
  const volunteer = await getApiVolunteer(request)
  const history = await queries.getVolunteerParticipationHistory(volunteer.id)
  return apiSuccess(toSnakeCaseArray(history))
})
