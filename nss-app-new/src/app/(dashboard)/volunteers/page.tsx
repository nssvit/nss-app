import { redirect } from 'next/navigation'
import { VolunteersPage } from '@/components/volunteers'
import { getCurrentVolunteer } from '@/lib/auth-cache'
import { queries } from '@/db/queries'
import { withRetry } from '@/db'
import { mapVolunteerRow } from '@/lib/mappers'

export default async function Page() {
  const volunteer = await getCurrentVolunteer()

  // Parallelize auth check and data fetch instead of sequential waterfall
  const [isAdmin, rows] = await Promise.all([
    withRetry(() => queries.volunteerHasRole(volunteer.id, 'admin')),
    withRetry(() => queries.getVolunteersWithStats()),
  ])

  if (!isAdmin) redirect('/dashboard')

  const volunteers = rows.map(mapVolunteerRow)
  return <VolunteersPage initialData={volunteers} />
}
