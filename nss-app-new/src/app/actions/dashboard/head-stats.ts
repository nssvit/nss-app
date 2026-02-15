'use server'

import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { parseRows } from '@/db/query-validators'
import { getCurrentVolunteer as getCachedVolunteer } from '@/lib/auth-cache'

const headEventRowSchema = z.object({
  id: z.string(),
  event_name: z.string(),
  event_description: z.string().nullable(),
  start_date: z.union([z.string(), z.date()]),
  end_date: z.union([z.string(), z.date()]),
  declared_hours: z.number(),
  is_active: z.union([z.boolean(), z.number()]),
  created_at: z.union([z.string(), z.date()]),
  category_name: z.string().nullable(),
  participant_count: z.number(),
  total_hours: z.number(),
}).passthrough()

type HeadEventRow = z.infer<typeof headEventRowSchema>

/**
 * Get heads dashboard stats (events created by current user)
 */
export async function getHeadsDashboardStats() {
  const volunteer = await getCachedVolunteer()

  // Get events created by this head
  const result = await db.execute(sql`
    SELECT
      e.id,
      e.event_name,
      e.description as event_description,
      e.start_date,
      e.end_date,
      e.declared_hours,
      e.is_active,
      e.created_at,
      ec.category_name,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int as participant_count,
      COALESCE(SUM(ep.approved_hours), 0)::int as total_hours
    FROM events e
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    WHERE e.created_by_volunteer_id = ${volunteer.id}
    GROUP BY e.id, ec.category_name
    ORDER BY e.created_at DESC
  `)

  const myEvents: HeadEventRow[] = parseRows(result, headEventRowSchema)

  // Calculate stats
  const totalParticipants = myEvents.reduce((sum, event) => sum + event.participant_count, 0)
  const hoursManaged = myEvents.reduce((sum, event) => sum + event.total_hours, 0)
  const activeEvents = myEvents.filter((event) => {
    const eventDate = new Date(event.start_date as string)
    const isActive = typeof event.is_active === 'number' ? event.is_active !== 0 : event.is_active
    return isActive && eventDate >= new Date()
  }).length

  return {
    stats: {
      myEvents: myEvents.length,
      totalParticipants,
      hoursManaged,
      activeEvents,
    },
    events: myEvents,
  }
}
