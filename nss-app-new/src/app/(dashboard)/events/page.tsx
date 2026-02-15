import { EventsPage } from '@/components/events'
import { requireAuthServer } from '@/lib/auth-server'
import { queries } from '@/db/queries'
import { mapEventRow } from '@/lib/mappers'
import { eq } from 'drizzle-orm'
import { db, withRetry } from '@/db'
import { eventCategories } from '@/db/schema'

export default async function Events() {
  await requireAuthServer()
  const [eventRows, categoryRows] = await Promise.all([
    withRetry(() => queries.getEventsWithStats()),
    withRetry(() =>
      db.query.eventCategories.findMany({
        where: eq(eventCategories.isActive, true),
        orderBy: (categories, { asc }) => [asc(categories.categoryName)],
      })
    ),
  ])
  const events = eventRows.map(mapEventRow)
  const categories = categoryRows.map((r) => ({
    ...r,
    colorHex: r.colorHex ?? '#6366F1',
    isActive: r.isActive ?? true,
  }))

  return <EventsPage initialData={{ events, categories }} />
}
