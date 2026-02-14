'use client'

/**
 * Volunteers Hook
 *
 * Fetches and manages volunteers using Server Actions (Drizzle ORM)
 * Simplified from 265 LOC to ~90 LOC
 */

import { useState, useEffect, useCallback } from 'react'
import { isCurrentUserAdmin } from '@/app/actions/roles'
import {
  getVolunteers as fetchVolunteersAction,
  updateVolunteer as updateVolunteerAction,
} from '@/app/actions/volunteers'
import type { Volunteer } from '@/db/schema'

// Extended volunteer type with computed fields and snake_case aliases
export interface VolunteerWithStats extends Volunteer {
  eventsParticipated?: number
  totalHours?: number
  status?: 'Active' | 'Inactive' | 'Pending'
  joinDate?: string
  avatar?: string
  // Snake_case aliases for compatibility
  first_name?: string
  last_name?: string
  roll_number?: string
  phone_no?: string | null
  birth_date?: string | null
  nss_join_year?: number | null
  profile_pic?: string | null
  is_active?: boolean | null
  auth_user_id?: string | null
}

export interface UseVolunteersReturn {
  volunteers: VolunteerWithStats[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateVolunteer: (id: string, updates: Partial<Volunteer>) => Promise<{ error: string | null }>
  isAdmin: boolean
}

export function useVolunteers(): UseVolunteersReturn {
  const [volunteers, setVolunteers] = useState<VolunteerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchVolunteers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch volunteers and admin status in parallel
      const [volunteersData, adminStatus] = await Promise.all([
        fetchVolunteersAction(),
        isCurrentUserAdmin().catch(() => false),
      ])

      // Transform data with computed fields and snake_case aliases
      const transformed: VolunteerWithStats[] = volunteersData.map((v: any) => ({
        ...v,
        status: v.isActive ? 'Active' : 'Inactive',
        joinDate: v.createdAt
          ? new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : undefined,
        avatar: v.profilePic || 'https://i.imgur.com/gVo4gxC.png',
        eventsParticipated: v.eventsParticipated || 0,
        totalHours: v.totalHours || 0,
        // Snake_case aliases
        first_name: v.firstName,
        last_name: v.lastName,
        roll_number: v.rollNumber,
        phone_no: v.phoneNo,
        birth_date: v.birthDate,
        nss_join_year: v.nssJoinYear,
        profile_pic: v.profilePic,
        is_active: v.isActive,
        auth_user_id: v.authUserId,
      }))

      setVolunteers(transformed)
      setIsAdmin(adminStatus)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch volunteers'
      console.error('[useVolunteers] Error:', message)
      setError(message)
      setVolunteers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUpdateVolunteer = useCallback(
    async (id: string, updates: Partial<Volunteer>) => {
      try {
        await updateVolunteerAction(id, updates)
        await fetchVolunteers() // Refresh list
        return { error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update volunteer'
        return { error: message }
      }
    },
    [fetchVolunteers]
  )

  // Initial fetch on mount
  useEffect(() => {
    fetchVolunteers()
  }, [fetchVolunteers])

  return {
    volunteers,
    loading,
    error,
    refetch: fetchVolunteers,
    updateVolunteer: handleUpdateVolunteer,
    isAdmin,
  }
}
