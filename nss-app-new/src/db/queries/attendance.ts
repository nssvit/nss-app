/**
 * Attendance Queries
 * Provides attendance-related database operations
 */

import { eq, and, sql, count, inArray } from 'drizzle-orm'
import { parseRows, eventParticipantRowSchema, eventsForAttendanceRowSchema } from '../query-validators'
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
      ep.notes,
      ep.approval_status,
      ep.approved_hours,
      ep.approved_by,
      ep.approved_at
    FROM event_participation ep
    JOIN volunteers v ON ep.volunteer_id = v.id
    WHERE ep.event_id = ${eventId}
    ORDER BY v.first_name, v.last_name
  `)

  return parseRows(result, eventParticipantRowSchema)
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
    // Get current participants
    const currentParticipants = await tx
      .select({ volunteerId: eventParticipation.volunteerId })
      .from(eventParticipation)
      .where(eq(eventParticipation.eventId, eventId))

    const currentIds = new Set(currentParticipants.map((p) => p.volunteerId))
    const newIds = new Set(selectedVolunteerIds)

    // Find volunteers to add and remove
    const toAdd = selectedVolunteerIds.filter((id) => !currentIds.has(id))
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
        }))
      )
    }

    return {
      addedCount: toAdd.length,
      removedCount: toRemove.length,
      message: `Synced: added ${toAdd.length}, removed ${toRemove.length}`,
    }
  })
}

/**
 * Register a volunteer for an event
 * Replaces: register_for_event RPC function (server-side version)
 */
export async function registerForEvent(
  eventId: string,
  volunteerId: string
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

    // Check event exists and is active
    const [event] = await tx
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.isActive, true)))

    if (!event) {
      throw new Error('Event not found or is inactive')
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
  // Only set fields that are explicitly provided to avoid overwriting with NULL
  const setFields: Record<string, unknown> = { updatedAt: new Date() }
  if (updates.participationStatus !== undefined) setFields.participationStatus = updates.participationStatus
  if (updates.hoursAttended !== undefined) setFields.hoursAttended = updates.hoursAttended
  if (updates.notes !== undefined) setFields.notes = updates.notes

  const [result] = await db
    .update(eventParticipation)
    .set(setFields)
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

  return await db.transaction(async (tx) => {
    let updatedCount = 0

    for (const volunteerId of volunteerIds) {
      // Check if participation exists
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
        // Update existing
        await tx
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
        await tx.insert(eventParticipation).values({
          eventId,
          volunteerId,
          participationStatus: status,
          hoursAttended: hoursAttended ?? 0,
          notes,
          registrationDate: new Date(),
          attendanceDate: new Date(),
          recordedByVolunteerId: recordedBy,
        })
        updatedCount++
      }
    }

    return { count: updatedCount, error: null }
  })
}

/**
 * Get events for attendance manager
 */
export async function getEventsForAttendance(limit: number = 50) {
  const result = await db.execute(sql`
    SELECT
      e.id,
      e.event_name,
      e.start_date,
      e.declared_hours,
      e.location
    FROM events e
    WHERE e.is_active = true
    ORDER BY e.start_date DESC
    LIMIT ${limit}
  `)

  return parseRows(result, eventsForAttendanceRowSchema)
}
