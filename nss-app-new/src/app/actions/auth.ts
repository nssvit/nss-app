'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db, withRetry } from '@/db'
import { volunteers } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import type { CurrentUser } from '@/types'

interface VolunteerProfileData {
  firstName: string
  lastName: string
  email: string
  rollNumber: string
  branch: string
  year: string
}

/**
 * Called after signup to create the volunteer profile row.
 * Replicates the old handle_new_user() DB trigger logic:
 * 1. Try to match by email → link auth_user_id
 * 2. Try to match by name → link auth_user_id
 * 3. Create new volunteer row
 */
export async function ensureVolunteerProfile(data: VolunteerProfileData): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { success: false, error: 'Not authenticated' }

  const authUserId = session.user.id

  try {
    return await withRetry(async () => {
      // Check if already linked
      const existing = await db.query.volunteers.findFirst({
        where: eq(volunteers.authUserId, authUserId),
      })
      if (existing) return { success: true }

      // Try email match
      const byEmail = await db.query.volunteers.findFirst({
        where: eq(volunteers.email, data.email),
      })
      if (byEmail && !byEmail.authUserId) {
        await db
          .update(volunteers)
          .set({ authUserId, updatedAt: new Date() })
          .where(eq(volunteers.id, byEmail.id))
        return { success: true }
      }

      // Try name match (first + last)
      const byName = await db.execute(sql`
        SELECT id, auth_user_id FROM volunteers
        WHERE LOWER(first_name) = LOWER(${data.firstName})
          AND LOWER(last_name) = LOWER(${data.lastName})
          AND auth_user_id IS NULL
        LIMIT 1
      `)
      const nameMatch = Array.isArray(byName) ? byName[0] : null
      if (nameMatch) {
        await db
          .update(volunteers)
          .set({ authUserId, updatedAt: new Date() })
          .where(eq(volunteers.id, nameMatch.id as string))
        return { success: true }
      }

      // Create new volunteer
      await db.insert(volunteers).values({
        authUserId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        rollNumber: data.rollNumber,
        branch: data.branch,
        year: data.year,
      })

      // Assign default volunteer role
      await db.execute(sql`
        INSERT INTO user_roles (volunteer_id, role_definition_id, is_active)
        SELECT v.id, rd.id, true
        FROM volunteers v
        CROSS JOIN role_definitions rd
        WHERE v.auth_user_id = ${authUserId}
          AND rd.role_name = 'volunteer'
        ON CONFLICT (volunteer_id, role_definition_id) DO NOTHING
      `)

      return { success: true }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create volunteer profile'
    return { success: false, error: message }
  }
}

/**
 * Fetch the current user's volunteer profile + roles.
 * Called from the client-side auth context.
 */
export async function fetchCurrentUserProfile(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  try {
    const result = await withRetry(async () => {
      const rows = await db.execute(sql`
        SELECT
          v.id as volunteer_id,
          v.first_name, v.last_name, v.roll_number, v.email,
          v.branch, v.year, v.phone_no, v.birth_date, v.gender,
          v.nss_join_year, v.address, v.profile_pic, v.is_active,
          COALESCE(
            ARRAY_AGG(rd.role_name) FILTER (WHERE rd.role_name IS NOT NULL),
            ARRAY[]::text[]
          ) as role_names
        FROM volunteers v
        LEFT JOIN user_roles ur ON ur.volunteer_id = v.id
          AND ur.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        LEFT JOIN role_definitions rd ON ur.role_definition_id = rd.id
          AND rd.is_active = true
        WHERE v.auth_user_id = ${session.user.id} AND v.is_active = true
        GROUP BY v.id
        LIMIT 1
      `)

      const row = Array.isArray(rows) ? rows[0] : null
      if (!row) return null

      const r = row as Record<string, unknown>
      const roles = (r.role_names as string[]) ?? []

      return {
        volunteerId: r.volunteer_id as string,
        firstName: r.first_name as string,
        lastName: r.last_name as string,
        email: r.email as string,
        rollNumber: r.roll_number as string,
        branch: r.branch as string,
        year: r.year as string,
        phoneNo: (r.phone_no as string) ?? null,
        birthDate: (r.birth_date as string) ?? null,
        gender: (r.gender as string) ?? null,
        nssJoinYear: (r.nss_join_year as number) ?? null,
        address: (r.address as string) ?? null,
        profilePic: (r.profile_pic as string) ?? null,
        isActive: r.is_active as boolean,
        roles: roles.length > 0 ? roles : ['volunteer'],
      } satisfies CurrentUser
    })

    return result
  } catch {
    return null
  }
}
