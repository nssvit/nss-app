'use client'

/**
 * Roles Hook
 *
 * Manages role assignments using Server Actions (Drizzle ORM)
 * Simplified from 317 LOC to ~80 LOC
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getRoles as fetchRolesAction,
  getVolunteerRoles as fetchVolunteerRolesAction,
  assignRole as assignRoleAction,
  revokeRole as revokeRoleAction,
  isCurrentUserAdmin,
} from '@/app/actions/roles'
import type { RoleDefinition, UserRole } from '@/db/schema'

// Type for cached volunteer role with role name
export interface CachedVolunteerRole {
  id: string
  roleName?: string
  roleDefinitionId?: string
}

export interface UseRolesReturn {
  roles: RoleDefinition[]
  loading: boolean
  error: string | null
  isAdmin: boolean
  refetch: () => Promise<void>
  getVolunteerRoles: (volunteerId: string) => Promise<UserRole[]>
  volunteerRolesCache: Record<string, CachedVolunteerRole[]>
  loadVolunteerRoles: (volunteerIds: string[]) => Promise<void>
  assignRole: (volunteerId: string, roleId: string) => Promise<{ error: string | null }>
  revokeRole: (volunteerId: string, roleId: string) => Promise<{ error: string | null }>
}

export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [volunteerRolesCache, setVolunteerRolesCache] = useState<
    Record<string, CachedVolunteerRole[]>
  >({})

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [rolesData, adminStatus] = await Promise.all([
        fetchRolesAction(),
        isCurrentUserAdmin().catch(() => false),
      ])

      setRoles(rolesData)
      setIsAdmin(adminStatus)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roles'
      console.error('[useRoles] Error:', message)
      setError(message)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getVolunteerRoles = useCallback(async (volunteerId: string) => {
    try {
      const result = await fetchVolunteerRolesAction(volunteerId)
      // Update cache
      setVolunteerRolesCache((prev) => ({
        ...prev,
        [volunteerId]: result.map((r: any) => ({
          id: r.id,
          roleName: r.roleName || r.role_name,
          roleDefinitionId: r.roleDefinitionId || r.role_definition_id,
        })),
      }))
      return result
    } catch (err) {
      console.error('[useRoles] Error fetching volunteer roles:', err)
      return []
    }
  }, [])

  // Load roles for multiple volunteers at once
  const loadVolunteerRoles = useCallback(async (volunteerIds: string[]) => {
    try {
      const results = await Promise.all(
        volunteerIds.map((id) => fetchVolunteerRolesAction(id).catch(() => []))
      )
      const newCache: Record<string, CachedVolunteerRole[]> = {}
      volunteerIds.forEach((id, index) => {
        newCache[id] = (results[index] || []).map((r: any) => ({
          id: r.id,
          roleName: r.roleName || r.role_name,
          roleDefinitionId: r.roleDefinitionId || r.role_definition_id,
        }))
      })
      setVolunteerRolesCache((prev) => ({ ...prev, ...newCache }))
    } catch (err) {
      console.error('[useRoles] Error loading volunteer roles:', err)
    }
  }, [])

  const handleAssignRole = useCallback(async (volunteerId: string, roleId: string) => {
    try {
      await assignRoleAction(volunteerId, roleId)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to assign role' }
    }
  }, [])

  const handleRevokeRole = useCallback(async (volunteerId: string, roleId: string) => {
    try {
      await revokeRoleAction(volunteerId, roleId)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to revoke role' }
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  return {
    roles,
    loading,
    error,
    isAdmin,
    refetch: fetchRoles,
    getVolunteerRoles,
    volunteerRolesCache,
    loadVolunteerRoles,
    assignRole: handleAssignRole,
    revokeRole: handleRevokeRole,
  }
}
