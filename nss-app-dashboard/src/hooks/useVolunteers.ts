'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Volunteer } from '@/types'

export function useVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVolunteers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('volunteers')
        .select(`
          *,
          user_roles!user_roles_volunteer_id_fkey(
            role_definition_id,
            role_definitions(role_name, display_name)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to match the existing Volunteer interface
      const transformedVolunteers: Volunteer[] = (data || []).map(volunteer => ({
        ...volunteer,
        status: volunteer.is_active ? 'Active' : 'Inactive' as 'Active' | 'Inactive' | 'Pending',
        joinDate: new Date(volunteer.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        }),
        avatar: volunteer.profile_pic || `https://i.imgur.com/gVo4gxC.png`,
        eventsParticipated: 0, // Will be calculated from participation data
        totalHours: 0 // Will be calculated from participation data
      }))

      setVolunteers(transformedVolunteers)
      setError(null)
    } catch (err) {
      console.error('Error fetching volunteers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch volunteers')
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
    deleteVolunteer
  }
}