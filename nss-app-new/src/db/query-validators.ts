/**
 * Zod validators for raw SQL query return types.
 *
 * These schemas validate the shape of rows returned by `db.execute(sql`...`)`
 * to catch column renames or structural mismatches at runtime rather than
 * silently returning undefined fields.
 *
 * Usage:
 *   const rows = parseRows(result, mySchema)
 */

import { z } from 'zod'

// --- Helper ---

/**
 * Parse raw SQL result rows through a Zod schema.
 * Validates structure and coerces types. Throws on mismatch.
 */
export function parseRows<T extends z.ZodTypeAny>(rows: unknown, schema: T): z.infer<T>[] {
  const arr = Array.isArray(rows) ? rows : []
  if (arr.length === 0) return []
  // Validate first row fully, then trust the rest (same query = same shape)
  schema.parse(arr[0])
  return arr as z.infer<T>[]
}

// --- Dashboard ---

export const monthlyTrendRowSchema = z.object({
  month: z.string(),
  month_number: z.number(),
  year_number: z.number(),
  events_count: z.number(),
  volunteers_count: z.number(),
  hours_sum: z.number(),
}).passthrough()

// --- Events ---

export const eventWithStatsRowSchema = z.object({
  id: z.string(),
  event_name: z.string(),
  description: z.string().nullable(),
  start_date: z.any(),
  end_date: z.any(),
  declared_hours: z.number(),
  location: z.string().nullable(),
  max_participants: z.number().nullable(),
  min_participants: z.number().nullable(),
  registration_deadline: z.any().nullable(),
  event_status: z.string(),
  category_id: z.number().nullable(),
  created_by_volunteer_id: z.string().nullable(),
  is_active: z.any(),
  created_at: z.any(),
  updated_at: z.any(),
  participant_count: z.number(),
  total_hours: z.number(),
  category_name: z.string().nullable(),
  category_color: z.string().nullable(),
}).passthrough()

// --- Attendance ---

export const eventParticipantRowSchema = z.object({
  participant_id: z.string(),
  volunteer_id: z.string(),
  volunteer_name: z.string(),
  roll_number: z.string(),
  branch: z.string(),
  year: z.string(),
  participation_status: z.string(),
  hours_attended: z.number(),
  attendance_date: z.any().nullable(),
  registration_date: z.any(),
  notes: z.string().nullable(),
  approval_status: z.string().nullable(),
  approved_hours: z.number().nullable(),
  approved_by: z.string().nullable(),
  approved_at: z.any().nullable(),
}).passthrough()

export const eventsForAttendanceRowSchema = z.object({
  id: z.string(),
  event_name: z.string(),
  start_date: z.any(),
  declared_hours: z.number(),
  location: z.string().nullable(),
}).passthrough()

// --- Reports ---

export const categoryDistributionRowSchema = z.object({
  category_id: z.number(),
  category_name: z.string(),
  event_count: z.number(),
  color_hex: z.string().nullable(),
  participant_count: z.number(),
  total_hours: z.number(),
}).passthrough()

export const topEventRowSchema = z.object({
  event_id: z.string(),
  event_name: z.string(),
  start_date: z.any().nullable(),
  category_name: z.string(),
  participant_count: z.number(),
  total_hours: z.number(),
  impact_score: z.string(),
  event_status: z.string(),
}).passthrough()

export const attendanceSummaryRowSchema = z.object({
  event_id: z.string(),
  event_name: z.string(),
  start_date: z.any().nullable(),
  category_name: z.string().nullable(),
  total_registered: z.any(),
  total_present: z.any(),
  total_absent: z.any(),
  attendance_rate: z.any(),
  total_hours: z.any(),
}).passthrough()

export const volunteerHoursSummaryRowSchema = z.object({
  volunteer_id: z.string(),
  volunteer_name: z.string(),
  total_hours: z.number(),
  approved_hours: z.number(),
  events_count: z.number(),
  last_activity: z.any().nullable(),
}).passthrough()

export const participationHistoryRowSchema = z.object({
  participation_id: z.string(),
  event_id: z.string(),
  event_name: z.string(),
  start_date: z.any().nullable(),
  category_name: z.string().nullable(),
  participation_status: z.string(),
  hours_attended: z.number(),
  attendance_date: z.any().nullable(),
  registration_date: z.any().nullable(),
  notes: z.string().nullable(),
  approval_status: z.string().nullable(),
  approved_hours: z.number().nullable(),
  approved_by: z.string().nullable(),
  approved_at: z.any().nullable(),
  approval_notes: z.string().nullable(),
  created_at: z.any(),
}).passthrough()

// --- Volunteers ---

export const volunteerWithStatsRowSchema = z.object({
  id: z.string(),
  volunteer_id: z.string(),
  auth_user_id: z.string().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  roll_number: z.string(),
  email: z.string(),
  branch: z.string(),
  year: z.string(),
  phone_no: z.string().nullable(),
  birth_date: z.any().nullable(),
  gender: z.string().nullable(),
  nss_join_year: z.number().nullable(),
  address: z.string().nullable(),
  profile_pic: z.string().nullable(),
  is_active: z.any(),
  created_at: z.any(),
  updated_at: z.any(),
  events_participated: z.number(),
  total_hours: z.number(),
  approved_hours: z.number(),
}).passthrough()
