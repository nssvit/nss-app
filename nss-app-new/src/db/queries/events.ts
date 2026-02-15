/**
 * Event Queries
 * Provides event-related database operations
 */

import { eq, and, sql, gte, count } from 'drizzle-orm'
import { parseRows, eventWithStatsRowSchema } from '../query-validators'
import { db } from '../index'
import { events, eventParticipation, type Event } from '../schema'

/**
 * Get all events with statistics
 * Replaces: get_events_with_stats RPC function
 */
export async function getEventsWithStats(volunteerId?: string) {
  const result = await db.execute(sql`
    SELECT
      e.id,
      e.event_name,
      e.description,
      e.start_date,
      e.end_date,
      e.declared_hours,
      e.location,
      e.max_participants,
      e.min_participants,
      e.registration_deadline,
      e.event_status,
      e.category_id,
      e.created_by_volunteer_id,
      e.is_active,
      e.created_at,
      e.updated_at,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int as participant_count,
      COALESCE(SUM(ep.approved_hours), 0)::int as total_hours,
      ec.category_name,
      ec.color_hex as category_color,
      ${
        volunteerId
          ? sql`(SELECT ep2.participation_status FROM event_participation ep2 WHERE ep2.event_id = e.id AND ep2.volunteer_id = ${volunteerId} LIMIT 1)`
          : sql`NULL`
      } as user_participation_status
    FROM events e
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    WHERE e.is_active = true
    GROUP BY e.id, ec.category_name, ec.color_hex
    ORDER BY e.created_at DESC
  `)

  return parseRows(result, eventWithStatsRowSchema)
}

/**
 * Get a single event by ID with full details
 */
export async function getEventById(eventId: string) {
  const result = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.isActive, true)),
    with: {
      category: true,
      createdBy: true,
      participations: {
        with: {
          volunteer: true,
        },
      },
    },
  })

  return result
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(limit: number = 10) {
  const result = await db.query.events.findMany({
    where: and(eq(events.isActive, true), gte(events.startDate, sql`NOW()`)),
    with: {
      category: true,
      createdBy: true,
    },
    orderBy: [events.startDate],
    limit,
  })

  return result
}

/**
 * Create event (server-side version)
 * Replaces: create_event RPC function
 */
export async function createEvent(
  eventData: {
    eventName: string
    description?: string | null
    startDate: Date
    endDate: Date
    declaredHours: number
    categoryId: number
    location?: string | null
    maxParticipants?: number | null
    minParticipants?: number | null
    registrationDeadline?: Date | null
    eventStatus?: string
  },
  createdByVolunteerId: string,
  volunteerIds?: string[]
) {
  return await db.transaction(async (tx) => {
    const [newEvent] = await tx
      .insert(events)
      .values({
        eventName: eventData.eventName,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        declaredHours: eventData.declaredHours,
        categoryId: eventData.categoryId,
        location: eventData.location,
        maxParticipants: eventData.maxParticipants,
        minParticipants: eventData.minParticipants,
        registrationDeadline: eventData.registrationDeadline,
        eventStatus: eventData.eventStatus ?? 'planned',
        createdByVolunteerId,
        isActive: true,
      })
      .returning()

    // Pre-register selected volunteers
    if (volunteerIds && volunteerIds.length > 0) {
      await tx.insert(eventParticipation).values(
        volunteerIds.map((volunteerId) => ({
          eventId: newEvent.id,
          volunteerId,
          participationStatus: 'registered' as const,
          registrationDate: new Date(),
        }))
      )
    }

    return { success: true, eventId: newEvent.id }
  })
}

/**
 * Update event
 */
export async function updateEvent(eventId: string, updates: Partial<Event>) {
  // Filter out undefined values to avoid overwriting existing data with NULL
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )
  return await db.transaction(async (tx) => {
    // Verify event exists and is active before updating
    const [existing] = await tx
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.isActive, true)))

    if (!existing) {
      throw new Error('Event not found or is inactive')
    }

    await tx
      .update(events)
      .set({
        ...cleanUpdates,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))

    return { success: true }
  })
}

/**
 * Soft delete event
 */
export async function deleteEvent(eventId: string) {
  return await db.transaction(async (tx) => {
    await tx
      .update(events)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))

    return { success: true }
  })
}

/**
 * Reset attendance for all participants of an event.
 * Sets participation_status back to 'registered', hours to 0, clears attendance date.
 * Used when an event is reopened (status moves backward from completed/ongoing).
 */
export async function resetEventAttendance(eventId: string) {
  await db
    .update(eventParticipation)
    .set({
      participationStatus: 'registered',
      hoursAttended: 0,
      attendanceDate: null,
      updatedAt: new Date(),
    })
    .where(eq(eventParticipation.eventId, eventId))
}

/**
 * Check if a volunteer can register for an event
 * Replaces: can_register_for_event RPC function
 */
export async function canRegisterForEvent(eventId: string, volunteerId?: string): Promise<boolean> {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.isActive, true)))

  if (!event) {
    return false
  }

  // Check event status
  if (!['planned', 'registration_open'].includes(event.eventStatus)) {
    return false
  }

  // Check registration deadline
  if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
    return false
  }

  // Check capacity
  if (event.maxParticipants) {
    const [{ count: currentCount }] = await db
      .select({ count: count() })
      .from(eventParticipation)
      .where(eq(eventParticipation.eventId, eventId))

    if (currentCount >= event.maxParticipants) {
      return false
    }
  }

  // If volunteerId provided, check if already registered
  if (volunteerId) {
    const [existing] = await db
      .select()
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.eventId, eventId),
          eq(eventParticipation.volunteerId, volunteerId)
        )
      )

    if (existing) {
      return false
    }
  }

  return true
}
