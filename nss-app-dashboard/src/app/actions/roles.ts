'use server'

import { queries } from '@/db/queries'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Auth helper - ensures user is authenticated
 */
async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Please sign in')
  }

  return user
}

/**
 * Get current user's volunteer ID
 */
async function getCurrentVolunteerId() {
  const user = await requireAuth()
  const volunteer = await queries.getVolunteerByAuthId(user.id)
  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }
  return volunteer.id
}

/**
 * Get all available roles
 */
export async function getRoles() {
  await requireAuth()
  return queries.getAllRoles()
}

/**
 * Get roles for a specific volunteer
 */
export async function getVolunteerRoles(volunteerId: string) {
  await requireAuth()
  return queries.getVolunteerRoles(volunteerId)
}

/**
 * Get current user's roles
 */
export async function getCurrentUserRoles() {
  const volunteerId = await getCurrentVolunteerId()
  return queries.getVolunteerRoles(volunteerId)
}

/**
 * Check if a volunteer has a specific role
 */
export async function hasRole(volunteerId: string, roleName: string) {
  await requireAuth()
  return queries.volunteerHasRole(volunteerId, roleName)
}

/**
 * Check if a volunteer has any of the specified roles
 */
export async function hasAnyRole(volunteerId: string, roleNames: string[]) {
  await requireAuth()
  return queries.volunteerHasAnyRole(volunteerId, roleNames)
}

/**
 * Check if a volunteer is an admin
 */
export async function isAdmin(volunteerId: string) {
  await requireAuth()
  return queries.isVolunteerAdmin(volunteerId)
}

/**
 * Check if current user is an admin
 */
export async function isCurrentUserAdmin() {
  const volunteerId = await getCurrentVolunteerId()
  return queries.isVolunteerAdmin(volunteerId)
}

/**
 * Assign a role to a volunteer (admin only)
 */
export async function assignRole(
  volunteerId: string,
  roleDefinitionId: string,
  expiresAt?: Date
) {
  const assignedBy = await getCurrentVolunteerId()

  // Check if current user is admin
  const adminCheck = await queries.isVolunteerAdmin(assignedBy)
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required')
  }

  const result = await queries.adminAssignRole(volunteerId, roleDefinitionId, assignedBy, expiresAt)
  revalidatePath('/roles')
  revalidatePath('/volunteers')
  return result
}

/**
 * Revoke a role from a volunteer (admin only)
 */
export async function revokeRole(volunteerId: string, roleDefinitionId: string) {
  const currentUserId = await getCurrentVolunteerId()

  // Check if current user is admin
  const adminCheck = await queries.isVolunteerAdmin(currentUserId)
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required')
  }

  const result = await queries.adminRevokeRole(volunteerId, roleDefinitionId)
  revalidatePath('/roles')
  revalidatePath('/volunteers')
  return result
}
