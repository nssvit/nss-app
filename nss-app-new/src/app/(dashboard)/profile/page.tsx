import { ProfilePage } from '@/components/profile'
import { requireAuthServer } from '@/lib/auth-server'
import { queries } from '@/db/queries'
import { mapParticipationRow } from '@/lib/mappers'

export default async function Page() {
  const user = await requireAuthServer()
  const volunteer = await queries.getVolunteerByAuthId(user.id)

  if (!volunteer) {
    return <ProfilePage />
  }

  const rows = await queries.getVolunteerParticipationHistory(volunteer.id)
  const participations = rows.map((r) => mapParticipationRow(r, volunteer.id))

  return <ProfilePage initialParticipations={participations} />
}
