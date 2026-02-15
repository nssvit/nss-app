/**
 * Attendance Write Queries
 */

import { eq, and, count, inArray, sql } from 'drizzle-orm'
import { db } from '../../index'
import { eventParticipation } from '../../schema'

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
    // Batch-fetch all existing participations for this event + volunteers
    const existing = await tx
      .select({ id: eventParticipation.id, volunteerId: eventParticipation.volunteerId })
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.eventId, eventId),
          inArray(eventParticipation.volunteerId, volunteerIds)
        )
      )

    const existingMap = new Map(existing.map((e) => [e.volunteerId, e.id]))
    const now = new Date()

    // Batch update existing participations
    const toUpdate = volunteerIds.filter((id) => existingMap.has(id))
    for (const volunteerId of toUpdate) {
      await tx
        .update(eventParticipation)
        .set({
          participationStatus: 'present',
          hoursAttended: declaredHours,
          attendanceDate: now,
          recordedByVolunteerId: recordedBy,
          updatedAt: now,
        })
        .where(eq(eventParticipation.id, existingMap.get(volunteerId)!))
    }

    // Batch insert new participations
    const toInsert = volunteerIds.filter((id) => !existingMap.has(id))
    if (toInsert.length > 0) {
      await tx.insert(eventParticipation).values(
        toInsert.map((volunteerId) => ({
          eventId,
          volunteerId,
          participationStatus: 'present' as const,
          hoursAttended: declaredHours,
          attendanceDate: now,
          recordedByVolunteerId: recordedBy,
        }))
      )
    }

    return {
      success: true,
      participantsAdded: toInsert.length,
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

    // Lock the event row to prevent concurrent registration race condition
    const [event] = await tx.execute<{
      id: string
      is_active: boolean
      max_participants: number | null
    }>(sql`
      SELECT id, is_active, max_participants
      FROM events
      WHERE id = ${eventId} AND is_active = true
      FOR UPDATE
    `)

    if (!event) {
      throw new Error('Event not found or is inactive')
    }

    if (event.max_participants) {
      const [{ count: currentCount }] = await tx
        .select({ count: count() })
        .from(eventParticipation)
        .where(eq(eventParticipation.eventId, eventId))

      if (currentCount >= event.max_participants) {
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
    // Batch-fetch all existing participations for this event + volunteers
    const existing = await tx
      .select({
        id: eventParticipation.id,
        volunteerId: eventParticipation.volunteerId,
        hoursAttended: eventParticipation.hoursAttended,
        notes: eventParticipation.notes,
      })
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.eventId, eventId),
          inArray(eventParticipation.volunteerId, volunteerIds)
        )
      )

    const existingMap = new Map(existing.map((e) => [e.volunteerId, e]))
    const now = new Date()

    // Update existing participations
    const toUpdate = volunteerIds.filter((id) => existingMap.has(id))
    for (const volunteerId of toUpdate) {
      const record = existingMap.get(volunteerId)!
      await tx
        .update(eventParticipation)
        .set({
          participationStatus: status,
          hoursAttended: hoursAttended ?? record.hoursAttended,
          notes: notes ?? record.notes,
          attendanceDate: now,
          updatedAt: now,
        })
        .where(eq(eventParticipation.id, record.id))
    }

    // Batch insert new participations
    const toInsert = volunteerIds.filter((id) => !existingMap.has(id))
    if (toInsert.length > 0) {
      await tx.insert(eventParticipation).values(
        toInsert.map((volunteerId) => ({
          eventId,
          volunteerId,
          participationStatus: status,
          hoursAttended: hoursAttended ?? 0,
          notes,
          registrationDate: now,
          attendanceDate: now,
          recordedByVolunteerId: recordedBy,
        }))
      )
    }

    return { count: toUpdate.length + toInsert.length, error: null }
  })
}
