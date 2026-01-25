/**
 * Volunteer Queries
 * Provides volunteer-related database operations
 */

import { eq, sql } from 'drizzle-orm'
import { db } from '../index'
import { volunteers, userRoles, type Volunteer } from '../schema'

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
      COALESCE(SUM(ep.approved_hours), 0)::int as total_hours
    FROM volunteers v
    LEFT JOIN event_participation ep ON v.id = ep.volunteer_id
      AND ep.approval_status = 'approved'
    WHERE v.is_active = true
    GROUP BY v.id
    ORDER BY v.created_at DESC
  `)

  return result as unknown[]
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
 */
export async function getVolunteerByAuthId(authUserId: string) {
  const result = await db.query.volunteers.findFirst({
    where: eq(volunteers.authUserId, authUserId),
    with: {
      assignedRoles: {
        where: eq(userRoles.isActive, true),
        with: {
          roleDefinition: true,
        },
      },
    },
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
  return await db.transaction(async (tx) => {
    const [volunteer] = await tx.select().from(volunteers).where(eq(volunteers.id, volunteerId))

    if (!volunteer) {
      throw new Error('Volunteer not found')
    }

    await tx
      .update(volunteers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(volunteers.id, volunteerId))

    return { success: true }
  })
}
