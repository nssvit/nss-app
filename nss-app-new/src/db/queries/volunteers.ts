/**
 * Volunteer Queries
 * Provides volunteer-related database operations
 */

import { eq, sql } from 'drizzle-orm'
import { parseRows, volunteerWithStatsRowSchema } from '../query-validators'
import { db } from '../index'
import { volunteers, type Volunteer } from '../schema'

/**
 * Get all volunteers with participation statistics
 * Replaces: get_volunteers_with_stats RPC function
 *
 * Note: This bypasses RLS. For operations respecting RLS, use Supabase client.
 */
export async function getVolunteersWithStats() {
  const result = await db.execute(sql`
    SELECT
      v.id,
      v.id as volunteer_id,
      v.auth_user_id,
      v.first_name,
      v.last_name,
      v.roll_number,
      v.email,
      v.branch,
      v.year,
      v.phone_no,
      v.birth_date,
      v.gender,
      v.nss_join_year,
      v.address,
      v.profile_pic,
      v.is_active,
      v.created_at,
      v.updated_at,
      COALESCE(COUNT(DISTINCT ep.event_id), 0)::int as events_participated,
      COALESCE(SUM(CASE WHEN ep.approval_status != 'rejected' THEN ep.hours_attended ELSE 0 END), 0)::int as total_hours,
      COALESCE(SUM(CASE WHEN ep.approval_status = 'approved' THEN ep.approved_hours ELSE 0 END), 0)::int as approved_hours,
      top_role.role_name as role_name
    FROM volunteers v
    LEFT JOIN event_participation ep ON v.id = ep.volunteer_id
      AND ep.event_id IN (SELECT id FROM events WHERE is_active = true)
    LEFT JOIN LATERAL (
      SELECT rd.role_name
      FROM user_roles ur
      JOIN role_definitions rd ON ur.role_definition_id = rd.id
      WHERE ur.volunteer_id = v.id AND ur.is_active = true AND rd.is_active = true
      ORDER BY rd.hierarchy_level DESC
      LIMIT 1
    ) top_role ON true
    WHERE v.is_active = true
    GROUP BY v.id, top_role.role_name
    ORDER BY v.created_at DESC
  `)

  return parseRows(result, volunteerWithStatsRowSchema)
}

/**
 * Get a single volunteer by ID with full details
 */
export async function getVolunteerById(volunteerId: string) {
  const result = await db.query.volunteers.findFirst({
    where: eq(volunteers.id, volunteerId),
    with: {
      assignedRoles: {
        with: {
          roleDefinition: true,
        },
      },
      participations: {
        with: {
          event: {
            with: {
              category: true,
            },
          },
        },
      },
    },
  })

  return result
}

/**
 * Get volunteer by auth user ID
 * Returns basic volunteer fields only (no relations).
 * Role checks are done separately via volunteerHasAnyRole().
 */
export async function getVolunteerByAuthId(authUserId: string) {
  const result = await db.query.volunteers.findFirst({
    where: eq(volunteers.authUserId, authUserId),
  })

  return result
}

/**
 * Admin: Get all volunteers (bypasses RLS)
 * Replaces: admin_get_all_volunteers RPC function
 */
export async function adminGetAllVolunteers() {
  return await getVolunteersWithStats()
}

/**
 * Admin: Update volunteer
 * Replaces: admin_update_volunteer RPC function
 */
export async function adminUpdateVolunteer(volunteerId: string, updates: Partial<Volunteer>) {
  // Filter out undefined values to avoid overwriting existing data with NULL
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )
  return await db.transaction(async (tx) => {
    const [volunteer] = await tx.select().from(volunteers).where(eq(volunteers.id, volunteerId))

    if (!volunteer) {
      throw new Error('Volunteer not found')
    }

    await tx
      .update(volunteers)
      .set({
        ...cleanUpdates,
        updatedAt: new Date(),
      })
      .where(eq(volunteers.id, volunteerId))

    return { success: true }
  })
}
