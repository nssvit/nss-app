/**
 * Attendance Queries
 * Provides attendance-related database operations
 */

import { eq, and, sql, count, inArray } from 'drizzle-orm'
import { db } from '../index'
import { events, eventParticipation } from '../schema'

/**
 * Get event participants with details
 * Replaces: get_event_participants RPC function
 */
export async function getEventParticipants(eventId: string) {
  const result = await db.execute(sql`
    SELECT
      ep.id as participant_id,
      ep.volunteer_id,
      CONCAT(v.first_name, ' ', v.last_name) as volunteer_name,
      v.roll_number,
      v.branch,
      v.year,
      ep.participation_status,
      ep.hours_attended,
      ep.attendance_date,
      ep.registration_date,
      ep.notes
    FROM event_participation ep
    JOIN volunteers v ON ep.volunteer_id = v.id
    WHERE ep.event_id = ${eventId}
    ORDER BY v.first_name, v.last_name
  `)

  return result as unknown[] as {
    participant_id: string
    volunteer_id: string
    volunteer_name: string
    roll_number: string
    branch: string
    year: string
    participation_status: string
    hours_attended: number
    attendance_date: Date | null
    registration_date: Date
    notes: string | null
  }[]
}

/**
 * Mark attendance for multiple volunteers at an event
 * Replaces: mark_event_attendance RPC function
 */
export async function markEventAttendance(
  eventId: string,
  volunteerIds: string[],
  declaredHours: number = 0,
  recordedBy?: string | null
) {
  if (volunteerIds.length === 0) {
    return { success: true, participantsAdded: 0, message: 'No volunteers to mark' }
  }

  return await db.transaction(async (tx) => {
    let addedCount = 0

    for (const volunteerId of volunteerIds) {
      // Check if participation already exists
      const [existing] = await tx
        .select()
        .from(eventParticipation)
        .where(
          and(
            eq(eventParticipation.eventId, eventId),
            eq(eventParticipation.volunteerId, volunteerId)
          )
        )

      if (existing) {
        // Update existing participation to present
        await tx
          .update(eventParticipation)
          .set({
            participationStatus: 'present',
            hoursAttended: declaredHours,
            attendanceDate: new Date(),
            recordedByVolunteerId: recordedBy,
            updatedAt: new Date(),
          })
          .where(eq(eventParticipation.id, existing.id))
      } else {
        // Create new participation
        await tx.insert(eventParticipation).values({
          eventId,
          volunteerId,
          participationStatus: 'present',
          hoursAttended: declaredHours,
          declaredHours,
          attendanceDate: new Date(),
          recordedByVolunteerId: recordedBy,
        })
        addedCount++
      }
    }

    return {
      success: true,
      participantsAdded: addedCount,
      message: `Marked attendance for ${volunteerIds.length} volunteers`,
    }
  })
}

/**
 * Update event attendance - sync participation list
 * Replaces: update_event_attendance RPC function
 */
export async function updateEventAttendance(
  eventId: string,
  volunteerIds: string[],
  recordedBy?: string | null
) {
  return await db.transaction(async (tx) => {
    // Get current participants
    const currentParticipants = await tx
      .select({ volunteerId: eventParticipation.volunteerId })
      .from(eventParticipation)
      .where(eq(eventParticipation.eventId, eventId))

    const currentIds = new Set(currentParticipants.map((p) => p.volunteerId))
    const newIds = new Set(volunteerIds)

    // Find volunteers to add and remove
    const toAdd = volunteerIds.filter((id) => !currentIds.has(id))
    const toRemove = [...currentIds].filter((id) => !newIds.has(id))

    // Remove participants no longer in the list
    if (toRemove.length > 0) {
      await tx
        .delete(eventParticipation)
        .where(
          and(
            eq(eventParticipation.eventId, eventId),
            inArray(eventParticipation.volunteerId, toRemove)
          )
        )
    }

    // Add new participants
    if (toAdd.length > 0) {
      await tx.insert(eventParticipation).values(
        toAdd.map((volunteerId) => ({
          eventId,
          volunteerId,
          participationStatus: 'present' as const,
          hoursAttended: 0,
          recordedByVolunteerId: recordedBy,
        }))
      )
    }

    return {
      success: true,
      added: toAdd.length,
      removed: toRemove.length,
      totalPresent: volunteerIds.length,
      message: `Updated attendance: added ${toAdd.length}, removed ${toRemove.length}`,
    }
  })
}

/**
 * Sync event attendance - replace all with selected volunteers
 * Replaces: sync_event_attendance RPC function
 */
export async function syncEventAttendance(eventId: string, selectedVolunteerIds: string[]) {
  return await db.transaction(async (tx) => {
    // Remove all current participants not in the new list
    await tx.delete(eventParticipation).where(
      and(
        eq(eventParticipation.eventId, eventId),
        selectedVolunteerIds.length > 0
          ? sql`${eventParticipation.volunteerId} NOT IN (${sql.join(
              selectedVolunteerIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          : sql`true`
      )
    )

    return {
      removedCount: 0,
      message: 'Synced event attendance',
    }
  })
}

/**
 * Register a volunteer for an event
 * Replaces: register_for_event RPC function (server-side version)
 */
export async function registerForEvent(
  eventId: string,
  volunteerId: string,
  declaredHours: number = 0
) {
  return await db.transaction(async (tx) => {
    // Check if already registered
    const [existing] = await tx
      .select()
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.eventId, eventId),
          eq(eventParticipation.volunteerId, volunteerId)
        )
      )

    if (existing) {
      throw new Error('Already registered for this event')
    }

    // Check event capacity
    const [event] = await tx.select().from(events).where(eq(events.id, eventId))

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.maxParticipants) {
      const [{ count: currentCount }] = await tx
        .select({ count: count() })
        .from(eventParticipation)
        .where(eq(eventParticipation.eventId, eventId))

      if (currentCount >= event.maxParticipants) {
        throw new Error('Event is at full capacity')
      }
    }

    // Register
    await tx.insert(eventParticipation).values({
      eventId,
      volunteerId,
      participationStatus: 'registered',
      declaredHours,
      registrationDate: new Date(),
    })

    return { success: true }
  })
}

/**
 * Update individual participation status
 */
export async function updateParticipationStatus(
  participantId: string,
  updates: {
    participationStatus?: string
    hoursAttended?: number
    notes?: string
  }
) {
  const [result] = await db
    .update(eventParticipation)
    .set({
      participationStatus: updates.participationStatus,
      hoursAttended: updates.hoursAttended,
      notes: updates.notes,
      updatedAt: new Date(),
    })
    .where(eq(eventParticipation.id, participantId))
    .returning()

  return result
}

/**
 * Bulk mark attendance with specific status
 */
export async function bulkMarkAttendance(params: {
  eventId: string
  volunteerIds: string[]
  status: string
  hoursAttended?: number
  notes?: string
  recordedBy: string
}) {
  const { eventId, volunteerIds, status, hoursAttended, notes, recordedBy } = params

  let updatedCount = 0

  for (const volunteerId of volunteerIds) {
    // Check if participation exists
    const existing = await db.query.eventParticipation.findFirst({
      where: and(
        eq(eventParticipation.eventId, eventId),
        eq(eventParticipation.volunteerId, volunteerId)
      ),
    })

    if (existing) {
      // Update existing
      await db
        .update(eventParticipation)
        .set({
          participationStatus: status,
          hoursAttended: hoursAttended ?? existing.hoursAttended,
          notes: notes ?? existing.notes,
          attendanceDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(eventParticipation.id, existing.id))
      updatedCount++
    } else {
      // Insert new
      await db.insert(eventParticipation).values({
        eventId,
        volunteerId,
        participationStatus: status,
        hoursAttended: hoursAttended ?? 0,
        declaredHours: hoursAttended ?? 0,
        notes,
        registrationDate: new Date(),
        attendanceDate: new Date(),
        recordedByVolunteerId: recordedBy,
      })
      updatedCount++
    }
  }

  return { count: updatedCount, error: null }
}

/**
 * Get events for attendance manager
 */
export async function getEventsForAttendance(limit: number = 50) {
  const result = await db.execute(sql`
    SELECT
      e.id,
      e.event_name,
      e.start_date as event_date,
      e.declared_hours,
      e.location
    FROM events e
    ORDER BY e.start_date DESC
    LIMIT ${limit}
  `)

  return result as unknown[] as {
    id: string
    event_name: string
    event_date: string
    declared_hours: number
    location: string | null
  }[]
}
