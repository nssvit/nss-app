'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Role, UserRole } from '@/types'

export interface UserRoleWithDetails extends UserRole {
  volunteer?: {
    id: string
    first_name: string
    last_name: string
    email: string
    roll_number: string
    profile_pic: string | null
  }
  role_definition?: Role
  assigned_by_volunteer?: {
    id: string
    first_name: string
    last_name: string
  }
}

export function useRoles() {
  const [roleDefinitions, setRoleDefinitions] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<UserRoleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all role definitions
  const fetchRoleDefinitions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('role_definitions')
        .select('*')
        .order('hierarchy_level', { ascending: true })

      if (error) throw error
      setRoleDefinitions(data || [])
    } catch (err) {
      console.error('Error fetching role definitions:', err)
      throw err
    }
  }, [])

  // Fetch all user role assignments with related data
  const fetchUserRoles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          volunteer:volunteers!user_roles_volunteer_id_fkey (
            id,
            first_name,
            last_name,
            email,
            roll_number,
            profile_pic
          ),
          role_definition:role_definitions!user_roles_role_definition_id_fkey (*),
          assigned_by_volunteer:volunteers!user_roles_assigned_by_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .order('assigned_at', { ascending: false })

      if (error) throw error
      setUserRoles(data || [])
    } catch (err) {
      console.error('Error fetching user roles:', err)
      throw err
    }
  }, [])

  // Fetch all data
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await Promise.all([fetchRoleDefinitions(), fetchUserRoles()])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [fetchRoleDefinitions, fetchUserRoles])

  // Get roles for a specific volunteer
  const getVolunteerRoles = useCallback((volunteerId: string) => {
    return userRoles.filter(ur => ur.volunteer_id === volunteerId && ur.is_active)
  }, [userRoles])

  // Check if a volunteer has a specific role
  const volunteerHasRole = useCallback((volunteerId: string, roleName: string) => {
    return userRoles.some(
      ur => ur.volunteer_id === volunteerId &&
            ur.role_definition?.role_name === roleName &&
            ur.is_active
    )
  }, [userRoles])

  // Assign a role to a volunteer
  const assignRole = async (
    volunteerId: string,
    roleDefinitionId: string,
    assignedBy: string | null = null,
    expiresAt: string | null = null
  ) => {
    try {
      // Check if volunteer already has this active role
      const existingRole = userRoles.find(
        ur => ur.volunteer_id === volunteerId &&
              ur.role_definition_id === roleDefinitionId &&
              ur.is_active
      )

      if (existingRole) {
        return {
          data: null,
          error: 'Volunteer already has this role'
        }
      }

      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          volunteer_id: volunteerId,
          role_definition_id: roleDefinitionId,
          assigned_by: assignedBy,
          expires_at: expiresAt,
          is_active: true,
          assigned_at: new Date().toISOString()
        })
        .select(`
          *,
          volunteer:volunteers!user_roles_volunteer_id_fkey (
            id,
            first_name,
            last_name,
            email,
            roll_number,
            profile_pic
          ),
          role_definition:role_definitions!user_roles_role_definition_id_fkey (*),
          assigned_by_volunteer:volunteers!user_roles_assigned_by_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .single()

      if (error) throw error

      await fetchUserRoles() // Refresh the list
      return { data, error: null }
    } catch (err) {
      console.error('Error assigning role:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to assign role'
      }
    }
  }

  // Revoke a role from a volunteer (soft delete)
  const revokeRole = async (userRoleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', userRoleId)

      if (error) throw error

      await fetchUserRoles() // Refresh the list
      return { error: null }
    } catch (err) {
      console.error('Error revoking role:', err)
      return {
        error: err instanceof Error ? err.message : 'Failed to revoke role'
      }
    }
  }

  // Update a user role (e.g., change expiration date)
  const updateUserRole = async (userRoleId: string, updates: Partial<UserRole>) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .update(updates)
        .eq('id', userRoleId)
        .select()
        .single()

      if (error) throw error

      await fetchUserRoles() // Refresh the list
      return { data, error: null }
    } catch (err) {
      console.error('Error updating user role:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to update role'
      }
    }
  }

  // Create a new role definition (Admin only)
  const createRoleDefinition = async (roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('role_definitions')
        .insert(roleData)
        .select()
        .single()

      if (error) throw error

      await fetchRoleDefinitions()
      return { data, error: null }
    } catch (err) {
      console.error('Error creating role definition:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to create role'
      }
    }
  }

  // Update a role definition
  const updateRoleDefinition = async (roleId: string, updates: Partial<Role>) => {
    try {
      const { data, error } = await supabase
        .from('role_definitions')
        .update(updates)
        .eq('id', roleId)
        .select()
        .single()

      if (error) throw error

      await fetchRoleDefinitions()
      return { data, error: null }
    } catch (err) {
      console.error('Error updating role definition:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to update role'
      }
    }
  }

  // Deactivate a role definition (soft delete)
  const deactivateRoleDefinition = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('role_definitions')
        .update({ is_active: false })
        .eq('id', roleId)

      if (error) throw error

      await fetchRoleDefinitions()
      return { error: null }
    } catch (err) {
      console.error('Error deactivating role definition:', err)
      return {
        error: err instanceof Error ? err.message : 'Failed to deactivate role'
      }
    }
  }

  // Get all volunteers with a specific role
  const getVolunteersByRole = useCallback((roleName: string) => {
    return userRoles.filter(
      ur => ur.role_definition?.role_name === roleName && ur.is_active
    )
  }, [userRoles])

  // Initial fetch
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    // State
    roleDefinitions,
    userRoles,
    loading,
    error,

    // Fetch functions
    fetchAll,
    fetchRoleDefinitions,
    fetchUserRoles,

    // Query helpers
    getVolunteerRoles,
    volunteerHasRole,
    getVolunteersByRole,

    // Role assignment mutations
    assignRole,
    revokeRole,
    updateUserRole,

    // Role definition mutations
    createRoleDefinition,
    updateRoleDefinition,
    deactivateRoleDefinition,
  }
}
