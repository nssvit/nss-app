import { EventsPage } from '@/components/events'
import { getCurrentVolunteer } from '@/lib/auth-cache'
import { queries } from '@/db/queries'
import { getCachedCategories } from '@/lib/query-cache'
import { mapEventRow } from '@/lib/mappers'
import { withRetry } from '@/db'

export default async function Events() {
  const volunteer = await getCurrentVolunteer()

  // Parallelize event fetch + cached categories lookup
  const [eventRows, categories] = await Promise.all([
    withRetry(() => queries.getEventsWithStats(volunteer.id)),
    getCachedCategories(),
  ])

  const events = eventRows.map(mapEventRow)
  return <EventsPage initialData={{ events, categories }} />
}
