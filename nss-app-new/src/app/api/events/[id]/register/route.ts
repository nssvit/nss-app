import { getApiVolunteer } from '@/lib/api-auth'
import { apiSuccess, withApiHandler } from '@/lib/api-response'
import { queries } from '@/db/queries'

export const POST = withApiHandler(async (request, { params }) => {
  const volunteer = await getApiVolunteer(request)
  const { id } = await params
  const result = await queries.registerForEvent(id, volunteer.id)
  return apiSuccess(result, 201)
})
