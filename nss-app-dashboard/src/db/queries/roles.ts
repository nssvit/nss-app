/**
 * Role Queries
 * Provides role-related database operations
 */

import { db } from '../index'
import { eq, and, count, asc, inArray } from 'drizzle-orm'
import { userRoles, roleDefinitions } from '../schema'

/**
 * Get all active roles for a volunteer
 */
export async function getVolunteerRoles(volunteerId: string) {
  const result = await db.query.userRoles.findMany({
    where: and(eq(userRoles.volunteerId, volunteerId), eq(userRoles.isActive, true)),
    with: {
      roleDefinition: true,
    },
  })

  return result
}

/**
 * Check if a volunteer has a specific role
 */
export async function volunteerHasRole(volunteerId: string, roleName: string): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(userRoles)
    .innerJoin(roleDefinitions, eq(userRoles.roleDefinitionId, roleDefinitions.id))
    .where(
      and(
        eq(userRoles.volunteerId, volunteerId),
        eq(userRoles.isActive, true),
        eq(roleDefinitions.roleName, roleName),
        eq(roleDefinitions.isActive, true)
      )
    )

  return (result[0]?.count ?? 0) > 0
}

/**
 * Check if a volunteer has any of the specified roles
 * Replaces: has_any_role RPC function (server-side version)
 */
export async function volunteerHasAnyRole(
  volunteerId: string,
  roleNames: string[]
): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(userRoles)
    .innerJoin(roleDefinitions, eq(userRoles.roleDefinitionId, roleDefinitions.id))
    .where(
      and(
        eq(userRoles.volunteerId, volunteerId),
        eq(userRoles.isActive, true),
        inArray(roleDefinitions.roleName, roleNames),
        eq(roleDefinitions.isActive, true)
      )
    )

  return (result[0]?.count ?? 0) > 0
}

/**
 * Check if a volunteer is an admin
 * Replaces: is_admin RPC function (server-side version)
 */
export async function isVolunteerAdmin(volunteerId: string): Promise<boolean> {
  return volunteerHasRole(volunteerId, 'admin')
}

/**
 * Get all role definitions
 */
export async function getAllRoles() {
  return await db.query.roleDefinitions.findMany({
    where: eq(roleDefinitions.isActive, true),
    orderBy: [asc(roleDefinitions.hierarchyLevel)],
  })
}

/**
 * Admin: Assign role to volunteer
 * Replaces: admin_assign_role RPC function
 */
export async function adminAssignRole(
  volunteerId: string,
  roleDefinitionId: string,
  assignedBy: string,
  expiresAt?: Date | null
) {
  return await db.transaction(async (tx) => {
    // Check if role is already assigned
    const [existing] = await tx
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.volunteerId, volunteerId),
          eq(userRoles.roleDefinitionId, roleDefinitionId),
          eq(userRoles.isActive, true)
        )
      )

    if (existing) {
      throw new Error('Role already assigned to this volunteer')
    }

    // Assign role
    await tx.insert(userRoles).values({
      volunteerId,
      roleDefinitionId,
      assignedBy,
      expiresAt,
    })

    return { success: true }
  })
}

/**
 * Admin: Revoke role from volunteer
 * Replaces: admin_revoke_role RPC function
 */
export async function adminRevokeRole(volunteerId: string, roleDefinitionId: string) {
  return await db.transaction(async (tx) => {
    await tx
      .update(userRoles)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userRoles.volunteerId, volunteerId),
          eq(userRoles.roleDefinitionId, roleDefinitionId),
          eq(userRoles.isActive, true)
        )
      )

    return { success: true }
  })
}
