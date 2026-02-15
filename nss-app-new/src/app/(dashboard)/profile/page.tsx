import { ProfilePage } from '@/components/profile'
import { getAuthUser } from '@/lib/auth-cache'
import { queries } from '@/db/queries'
import { withRetry } from '@/db'
import { mapParticipationRow } from '@/lib/mappers'

export default async function Page() {
  const user = await getAuthUser()
  const volunteer = await withRetry(() => queries.getVolunteerByAuthId(user.id))

  if (!volunteer) {
    return <ProfilePage />
  }

  const rows = await withRetry(() => queries.getVolunteerParticipationHistory(volunteer.id))
  const participations = rows.map((r) => mapParticipationRow(r, volunteer.id))

  return <ProfilePage initialParticipations={participations} />
}
