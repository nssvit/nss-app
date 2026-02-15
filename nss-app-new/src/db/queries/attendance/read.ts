/**
 * Attendance Read Queries
 */

import { sql } from 'drizzle-orm'
import { parseRows, eventParticipantRowSchema, eventsForAttendanceRowSchema } from '../../query-validators'
import { db } from '../../index'

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
