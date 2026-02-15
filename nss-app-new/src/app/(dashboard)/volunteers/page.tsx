import { redirect } from 'next/navigation'
import { VolunteersPage } from '@/components/volunteers'
import { getCurrentVolunteer } from '@/lib/auth-cache'
import { queries } from '@/db/queries'
import { withRetry } from '@/db'
import { mapVolunteerRow } from '@/lib/mappers'

export default async function Page() {
  const volunteer = await getCurrentVolunteer()
  const isAdmin = await withRetry(() => queries.volunteerHasRole(volunteer.id, 'admin'))
  if (!isAdmin) redirect('/dashboard')

  const rows = await withRetry(() => queries.getVolunteersWithStats())
  const volunteers = rows.map(mapVolunteerRow)
  return <VolunteersPage initialData={volunteers} />
}
