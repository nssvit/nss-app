/**
 * Role Queries
 * Provides role-related database operations
 */

import { eq, and, count, asc, inArray, sql, or, isNull } from 'drizzle-orm'
import { db } from '../index'
import { userRoles, roleDefinitions } from '../schema'

/** Reusable condition: role is active and not expired */
const roleIsActiveAndNotExpired = and(
  eq(userRoles.isActive, true),
  or(isNull(userRoles.expiresAt), sql`${userRoles.expiresAt} > NOW()`)
)

/**
 * Get all active roles for a volunteer
 */
export async function getVolunteerRoles(volunteerId: string) {
  const result = await db.query.userRoles.findMany({
    where: and(
      eq(userRoles.volunteerId, volunteerId),
      roleIsActiveAndNotExpired
    ),
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
        roleIsActiveAndNotExpired,
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
        roleIsActiveAndNotExpired,
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
 * Get all user role assignments with volunteer names and role definitions
 */
export async function getAllUserRolesWithNames() {
  return await db.query.userRoles.findMany({
    with: {
      roleDefinition: true,
      volunteer: {
        columns: { id: true, firstName: true, lastName: true, email: true },
      },
      assignedByVolunteer: {
        columns: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: (ur, { desc }) => [desc(ur.assignedAt)],
  })
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
 * Create a new role definition
 */
export async function createRoleDefinition(data: {
  roleName: string
  description?: string | null
  hierarchyLevel: number
  isActive?: boolean
}) {
  const [result] = await db
    .insert(roleDefinitions)
    .values({
      roleName: data.roleName,
      displayName: data.roleName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: data.description,
      hierarchyLevel: data.hierarchyLevel,
      isActive: data.isActive ?? true,
    })
    .returning()

  return result
}

/**
 * Update a role definition
 */
export async function updateRoleDefinition(
  roleId: string,
  data: {
    roleName?: string
    description?: string | null
    hierarchyLevel?: number
    isActive?: boolean
  }
) {
  const cleanUpdates = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )

  const [result] = await db
    .update(roleDefinitions)
    .set({
      ...cleanUpdates,
      updatedAt: new Date(),
    })
    .where(eq(roleDefinitions.id, roleId))
    .returning()

  return result
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
    // Check if role assignment already exists (active or revoked)
    const [existing] = await tx
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.volunteerId, volunteerId),
          eq(userRoles.roleDefinitionId, roleDefinitionId)
        )
      )

    if (existing && existing.isActive) {
      throw new Error('Role already assigned to this volunteer')
    }

    if (existing) {
      // Re-activate previously revoked role
      await tx
        .update(userRoles)
        .set({
          isActive: true,
          assignedBy,
          assignedAt: new Date(),
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(userRoles.id, existing.id))
    } else {
      // Assign new role
      await tx.insert(userRoles).values({
        volunteerId,
        roleDefinitionId,
        assignedBy,
        expiresAt,
      })
    }

    return { success: true }
  })
}

/**
 * Admin: Revoke role from volunteer
 * Replaces: admin_revoke_role RPC function
 */
export async function adminRevokeRole(volunteerId: string, roleDefinitionId: string) {
  return await db.transaction(async (tx) => {
    // Check if this is the last active admin role
    const [roleDef] = await tx
      .select({ roleName: roleDefinitions.roleName })
      .from(roleDefinitions)
      .where(eq(roleDefinitions.id, roleDefinitionId))

    if (roleDef?.roleName === 'admin') {
      const [adminCount] = await tx
        .select({ count: count() })
        .from(userRoles)
        .innerJoin(roleDefinitions, eq(userRoles.roleDefinitionId, roleDefinitions.id))
        .where(
          and(
            eq(roleDefinitions.roleName, 'admin'),
            eq(userRoles.isActive, true),
            eq(roleDefinitions.isActive, true)
          )
        )

      if ((adminCount?.count ?? 0) <= 1) {
        throw new Error('Cannot revoke the last admin role. Assign another admin first.')
      }
    }

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
