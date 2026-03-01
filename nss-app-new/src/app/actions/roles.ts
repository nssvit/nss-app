'use server'

import { revalidatePath } from 'next/cache'
import { queries } from '@/db/queries'
import { getAuthUser, getCurrentVolunteer, requireAdmin } from '@/lib/auth-cache'
import { getCachedRoleDefinitions } from '@/lib/query-cache'
import { logAudit } from '@/lib/audit'
import { invalidateRolesCache } from '@/lib/cache-invalidation'

/**
 * Get all available roles
 */
export async function getRoles() {
  await getAuthUser() // Cached auth check
  const rows = await getCachedRoleDefinitions()
  return rows.map((r) => ({
    ...r,
    permissions: (r.permissions ?? {}) as Record<string, string[]>,
    isActive: r.isActive ?? true,
  }))
}

/**
 * Get roles for a specific volunteer
 */
export async function getVolunteerRoles(volunteerId: string) {
  await getAuthUser()
  return queries.getVolunteerRoles(volunteerId)
}

/**
 * Get current user's roles
 */
export async function getCurrentUserRoles() {
  const volunteer = await getCurrentVolunteer()
  const rows = await queries.getVolunteerRoles(volunteer.id)
  return rows.map((r) => ({
    ...r,
    isActive: r.isActive ?? true,
    roleDefinition: {
      ...r.roleDefinition,
      permissions: (r.roleDefinition.permissions ?? {}) as Record<string, string[]>,
      isActive: r.roleDefinition.isActive ?? true,
    },
  }))
}

/**
 * Get all role assignments with volunteer names (admin only)
 */
export async function getAllRoleAssignments() {
  await requireAdmin()
  const rows = await queries.getAllUserRolesWithNames()
  return rows.map((r) => ({
    ...r,
    isActive: r.isActive ?? true,
    roleDefinition: {
      ...r.roleDefinition,
      permissions: (r.roleDefinition.permissions ?? {}) as Record<string, string[]>,
      isActive: r.roleDefinition.isActive ?? true,
    },
  }))
}

/**
 * Check if a volunteer has a specific role
 */
export async function hasRole(volunteerId: string, roleName: string) {
  await getAuthUser()
  return queries.volunteerHasRole(volunteerId, roleName)
}

/**
 * Check if a volunteer has any of the specified roles
 */
export async function hasAnyRole(volunteerId: string, roleNames: string[]) {
  await getAuthUser()
  return queries.volunteerHasAnyRole(volunteerId, roleNames)
}

/**
 * Check if a volunteer is an admin
 */
export async function isAdmin(volunteerId: string) {
  await getAuthUser()
  return queries.isVolunteerAdmin(volunteerId)
}

/**
 * Check if current user is an admin (uses cached auth)
 */
export async function isCurrentUserAdmin() {
  try {
    await requireAdmin()
    return true
  } catch {
    return false
  }
}

/**
 * Create a new role definition (admin only)
 */
export async function createRoleDefinition(data: {
  roleName: string
  description?: string
  hierarchyLevel: number
  isActive?: boolean
}) {
  const admin = await requireAdmin()
  const result = await queries.createRoleDefinition(data)
  logAudit({ action: 'role_definition.create', actorId: admin.id, targetType: 'roleDefinition', details: { roleName: data.roleName } })
  await invalidateRolesCache()
  revalidatePath('/role-management')
  return result
}

/**
 * Update a role definition (admin only)
 */
export async function updateRoleDefinition(
  roleId: string,
  data: {
    roleName?: string
    description?: string
    hierarchyLevel?: number
    isActive?: boolean
  }
) {
  const admin = await requireAdmin()
  const result = await queries.updateRoleDefinition(roleId, data)
  logAudit({ action: 'role_definition.update', actorId: admin.id, targetType: 'roleDefinition', targetId: roleId, details: data })
  await invalidateRolesCache()
  revalidatePath('/role-management')
  return result
}

/**
 * Assign a role to a volunteer (admin only)
 */
export async function assignRole(volunteerId: string, roleDefinitionId: string, expiresAt?: Date) {
  const admin = await requireAdmin()
  const result = await queries.adminAssignRole(
    volunteerId,
    roleDefinitionId,
    admin.id,
    expiresAt
  )
  logAudit({ action: 'role.assign', actorId: admin.id, targetType: 'volunteer', targetId: volunteerId, details: { roleDefinitionId } })
  revalidatePath('/role-management')
  revalidatePath('/volunteers')
  return result
}

/**
 * Revoke a role from a volunteer (admin only)
 */
export async function revokeRole(volunteerId: string, roleDefinitionId: string) {
  const admin = await requireAdmin()
  const result = await queries.adminRevokeRole(volunteerId, roleDefinitionId)
  logAudit({ action: 'role.revoke', actorId: admin.id, targetType: 'volunteer', targetId: volunteerId, details: { roleDefinitionId } })
  revalidatePath('/role-management')
  revalidatePath('/volunteers')
  return result
}
