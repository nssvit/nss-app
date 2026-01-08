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

      // Use optimized database function that includes stats
      const { data, error } = await supabase.rpc('get_volunteers_with_stats')

      if (error) {
        // Check if it's a function not found error
        if (error.message?.includes('does not exist') || error.code === '42883') {
          throw new Error(
            'Database function not found. Please run db/supabase_functions.sql in your Supabase SQL Editor.'
          )
        }
        throw new Error(error.message || 'Failed to fetch volunteers')
      }

      // Transform data to match the existing Volunteer interface
      const transformedVolunteers: Volunteer[] = (data || []).map((v: any) => ({
        id: v.volunteer_id,
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
        updated_at: v.created_at, // Using created_at as fallback
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