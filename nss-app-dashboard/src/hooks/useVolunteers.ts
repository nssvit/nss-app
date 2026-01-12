'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Volunteer } from '@/types'

export interface AdminDeleteResult {
  success: boolean
  volunteer_name?: string
  auth_user_id?: string
  deleted_counts?: {
    event_participation: number
    user_roles: number
    events_updated: number
    volunteer: number
  }
  error?: string
  note?: string
}

export function useVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVolunteers = async () => {
    try {
      setLoading(true)

      // Try admin function first (gets all volunteers), fallback to regular function
      let data: any[] | null = null
      let fetchError: any = null

      // Try admin function first
      const adminResult = await supabase.rpc('admin_get_all_volunteers')

      if (adminResult.error) {
        // Not admin or function not available, try regular function
        const regularResult = await supabase.rpc('get_volunteers_with_stats')
        data = regularResult.data
        fetchError = regularResult.error
      } else {
        data = adminResult.data
      }

      if (fetchError) {
        // Check if it's a function not found error
        if (fetchError.message?.includes('does not exist') || fetchError.code === '42883') {
          // Final fallback: direct table query
          const { data: directData, error: directError } = await supabase
            .from('volunteers')
            .select('*')
            .order('created_at', { ascending: false })

          if (directError) throw directError
          data = directData
        } else {
          throw new Error(fetchError.message || 'Failed to fetch volunteers')
        }
      }

      // Transform data to match the existing Volunteer interface
      const transformedVolunteers: Volunteer[] = (data || []).map((v: any) => ({
        id: v.id || v.volunteer_id,
        auth_user_id: v.auth_user_id,
        first_name: v.first_name,
        last_name: v.last_name,
        roll_number: v.roll_number,
        email: v.email,
        branch: v.branch,
        year: v.year,
        phone_no: v.phone_no,
        birth_date: v.birth_date,
        gender: v.gender,
        nss_join_year: v.nss_join_year,
        address: v.address,
        profile_pic: v.profile_pic,
        is_active: v.is_active,
        created_at: v.created_at,
        updated_at: v.updated_at || v.created_at,
        status: v.is_active ? 'Active' : 'Inactive' as 'Active' | 'Inactive' | 'Pending',
        joinDate: new Date(v.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        }),
        avatar: v.profile_pic || `https://i.imgur.com/gVo4gxC.png`,
        eventsParticipated: Number(v.events_participated) || 0,
        totalHours: Number(v.total_hours) || 0
      }))

      setVolunteers(transformedVolunteers)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch volunteers'
      console.error('Error fetching volunteers:', errorMessage)
      setError(errorMessage)
      setVolunteers([])
    } finally {
      setLoading(false)
    }
  }

  const addVolunteer = async (volunteerData: Omit<Volunteer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .insert({
          first_name: volunteerData.first_name,
          last_name: volunteerData.last_name,
          roll_number: volunteerData.roll_number,
          email: volunteerData.email,
          branch: volunteerData.branch,
          year: volunteerData.year,
          phone_no: volunteerData.phone_no,
          birth_date: volunteerData.birth_date,
          gender: volunteerData.gender,
          nss_join_year: volunteerData.nss_join_year,
          address: volunteerData.address,
          profile_pic: volunteerData.profile_pic
        })
        .select()
        .single()

      if (error) throw error

      await fetchVolunteers() // Refresh the list
      return { data, error: null }
    } catch (err) {
      console.error('Error adding volunteer:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to add volunteer' }
    }
  }

  const updateVolunteer = async (id: string, updates: Partial<Volunteer>) => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchVolunteers() // Refresh the list
      return { data, error: null }
    } catch (err) {
      console.error('Error updating volunteer:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update volunteer' }
    }
  }

  // Soft delete (deactivate) - safe operation
  const deleteVolunteer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('volunteers')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      await fetchVolunteers() // Refresh the list
      return { error: null }
    } catch (err) {
      console.error('Error deleting volunteer:', err)
      return { error: err instanceof Error ? err.message : 'Failed to delete volunteer' }
    }
  }

  // Admin: Permanently delete volunteer and all related data
  const adminPermanentDelete = async (volunteerId: string): Promise<{ data: AdminDeleteResult | null; error: string | null }> => {
    try {
      // Call the admin delete function
      const { data, error } = await supabase.rpc('admin_delete_volunteer', {
        p_volunteer_id: volunteerId
      })

      if (error) throw error

      const result = data as AdminDeleteResult

      if (!result.success) {
        return { data: null, error: result.error || 'Failed to delete volunteer' }
      }

      // If we have the auth_user_id, attempt to delete from auth.users via admin API
      // Note: This requires the Supabase Admin API call from a server-side function
      // For now, we'll just return the auth_user_id so the UI can handle it

      await fetchVolunteers() // Refresh the list
      return { data: result, error: null }
    } catch (err) {
      console.error('Error permanently deleting volunteer:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to permanently delete volunteer'
      }
    }
  }

  // Admin: Update any volunteer (bypasses RLS)
  const adminUpdateVolunteer = async (volunteerId: string, updates: Partial<Volunteer>) => {
    try {
      // Try admin function first
      const { data, error } = await supabase.rpc('admin_update_volunteer', {
        p_volunteer_id: volunteerId,
        p_updates: updates
      })

      if (error) {
        // Fallback to direct update (will use RLS policies)
        const { data: directData, error: directError } = await supabase
          .from('volunteers')
          .update(updates)
          .eq('id', volunteerId)
          .select()
          .single()

        if (directError) throw directError
        await fetchVolunteers()
        return { data: directData, error: null }
      }

      const result = data as { success: boolean; error?: string }
      if (!result.success) {
        return { data: null, error: result.error || 'Failed to update volunteer' }
      }

      await fetchVolunteers()
      return { data: result, error: null }
    } catch (err) {
      console.error('Error updating volunteer:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update volunteer' }
    }
  }

  // Check if current user is admin (for UI decisions)
  const checkIsAdmin = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_admin')
      if (error) return false
      return data === true
    } catch {
      return false
    }
  }

  useEffect(() => {
    fetchVolunteers()
  }, [])

  return {
    volunteers,
    loading,
    error,
    fetchVolunteers,
    addVolunteer,
    updateVolunteer,
    deleteVolunteer,
    // Admin operations
    adminPermanentDelete,
    adminUpdateVolunteer,
    checkIsAdmin,
  }
}