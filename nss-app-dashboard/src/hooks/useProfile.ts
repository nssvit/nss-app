'use client'

/**
 * Profile Hook
 *
 * Fetches and manages user profile using Server Actions (Drizzle ORM)
 */

import { useState, useEffect, useCallback } from 'react'
import { getMyProfile, updateMyProfile } from '@/app/actions/volunteers'

export interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phoneNo: string
  branch: string
  year: number
  rollNumber: string
  address: string
  birthDate: string
  gender: string
  nssJoinYear: number
  profilePic: string | null
}

export interface ProfileStats {
  totalHours: number
  approvedHours: number
  eventsParticipated: number
  pendingReviews: number
}

export interface ParticipationHistory {
  eventId: string
  eventName: string
  eventDate: string | null
  categoryName: string | null
  hoursAttended: number
  approvedHours: number | null
  approvalStatus: string
  participationStatus: string
}

export interface UseProfileReturn {
  profileData: ProfileData | null
  stats: ProfileStats | null
  participationHistory: ParticipationHistory[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateProfile: (updates: Partial<ProfileData>) => Promise<{ error: string | null }>
}

export function useProfile(): UseProfileReturn {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [participationHistory, setParticipationHistory] = useState<ParticipationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getMyProfile()

      // Transform volunteer data to ProfileData
      const vol = data.volunteer as any
      setProfileData({
        firstName: vol.firstName || '',
        lastName: vol.lastName || '',
        email: vol.email || '',
        phoneNo: vol.phoneNo || '',
        branch: vol.branch || '',
        year: vol.year || 0,
        rollNumber: vol.rollNumber || '',
        address: vol.address || '',
        birthDate: vol.birthDate || '',
        gender: vol.gender || '',
        nssJoinYear: vol.nssJoinYear || 0,
        profilePic: vol.profilePic,
      })

      // Transform participation data
      const history: ParticipationHistory[] = (data.participation || []).map((p: any) => ({
        eventId: p.event_id,
        eventName: p.event_name || 'Unknown Event',
        eventDate: p.event_date,
        categoryName: p.category_name || 'General',
        hoursAttended: p.hours_attended || 0,
        approvedHours: null, // Not available in this query
        approvalStatus: 'pending', // Not available in this query
        participationStatus: p.participation_status || 'registered',
      }))
      setParticipationHistory(history)

      // Calculate stats
      const totalHours = history.reduce((sum, p) => sum + p.hoursAttended, 0)
      setStats({
        totalHours,
        approvedHours: 0, // Would need separate query
        eventsParticipated: history.length,
        pendingReviews: history.filter(p => p.hoursAttended > 0 && p.approvalStatus === 'pending').length,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile'
      console.error('[useProfile] Error:', message)
      setError(message)
      setProfileData(null)
      setStats(null)
      setParticipationHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUpdate = useCallback(
    async (updates: Partial<ProfileData>) => {
      try {
        await updateMyProfile({
          firstName: updates.firstName,
          lastName: updates.lastName,
          phoneNo: updates.phoneNo,
          address: updates.address,
          gender: updates.gender,
        })
        await fetchData() // Refresh data
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to update profile' }
      }
    },
    [fetchData]
  )

  // Initial fetch on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    profileData,
    stats,
    participationHistory,
    loading,
    error,
    refetch: fetchData,
    updateProfile: handleUpdate,
  }
}
