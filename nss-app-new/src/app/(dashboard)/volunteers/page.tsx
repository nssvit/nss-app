import { VolunteersPage } from '@/components/volunteers'
import { requireAuthServer } from '@/lib/auth-server'
import { queries } from '@/db/queries'
import { mapVolunteerRow } from '@/lib/mappers'

export default async function Page() {
  await requireAuthServer()
  const rows = await queries.getVolunteersWithStats()
  const volunteers = rows.map(mapVolunteerRow)
  return <VolunteersPage initialData={volunteers} />
}
