/**
 * Attendance Hook
 * Fetches and manages attendance data
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface AttendanceRecord {
  event_id: string
  event_name: string
  event_date: string | null
  category_name: string
  total_registered: number
  total_present: number
  total_absent: number
  attendance_rate: number
  total_hours: number
}

export interface EventParticipant {
  participant_id: string
  volunteer_id: string
  volunteer_name: string
  roll_number: string
  branch: string
  year: string
  participation_status: string
  hours_attended: number
  attendance_date: string | null
  registration_date: string | null
  notes: string | null
}

export type ParticipationStatus = 'registered' | 'present' | 'absent' | 'partially_present' | 'excused'

export interface UpdateAttendanceParams {
  participantId: string
  status: ParticipationStatus
  hoursAttended?: number
  notes?: string
}

export interface BulkAttendanceParams {
  eventId: string
  volunteerIds: string[]
  status: ParticipationStatus
  hoursAttended: number
  notes?: string
}

export interface UseAttendanceReturn {
  attendanceRecords: AttendanceRecord[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getEventParticipants: (eventId: string) => Promise<EventParticipant[]>
  updateParticipationStatus: (params: UpdateAttendanceParams) => Promise<{ error: string | null }>
  bulkMarkAttendance: (params: BulkAttendanceParams) => Promise<{ count: number; error: string | null }>
  registerVolunteerForEvent: (eventId: string, volunteerId: string) => Promise<{ error: string | null }>
  unregisterFromEvent: (participantId: string) => Promise<{ error: string | null }>
}

export function useAttendance(): UseAttendanceReturn {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch attendance summary for all events
      const { data, error: attendanceError } = await supabase.rpc(
        'get_attendance_summary'
      )

      if (attendanceError) {
        // Check if it's a function not found error
        if (attendanceError.message?.includes('does not exist') || attendanceError.code === '42883') {
          throw new Error(
            'Database functions not found. Please run db/supabase_functions.sql in your Supabase SQL Editor.'
          )
        }
        throw new Error(attendanceError.message || 'Failed to fetch attendance data')
      }

      setAttendanceRecords((data || []) as AttendanceRecord[])
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch attendance data'
      console.error('Error fetching attendance data:', errorMessage)
      setError(errorMessage)
      setAttendanceRecords([])
    } finally {
      setLoading(false)
    }
  }

  const getEventParticipants = async (
    eventId: string
  ): Promise<EventParticipant[]> => {
    try {
      // First get participation records
      const { data: participationData, error: participationError } = await supabase
        .from('event_participation')
        .select('*')
        .eq('event_id', eventId)
        .order('registration_date', { ascending: true })

      if (participationError) {
        console.error('Error fetching participation:', participationError)
        throw participationError
      }

      if (!participationData || participationData.length === 0) {
        return []
      }

      // Get volunteer IDs
      const volunteerIds = participationData.map(p => p.volunteer_id).filter(Boolean)

      // Fetch volunteer details
      const { data: volunteersData, error: volunteersError } = await supabase
        .from('volunteers')
        .select('id, first_name, last_name, roll_number, branch, year')
        .in('id', volunteerIds)

      if (volunteersError) {
        console.error('Error fetching volunteers:', volunteersError)
      }

      // Create a map of volunteers by ID
      const volunteersMap = new Map(
        (volunteersData || []).map(v => [v.id, v])
      )

      // Combine data
      return participationData.map((p: any) => {
        const volunteer = volunteersMap.get(p.volunteer_id)
        return {
          participant_id: p.id,
          volunteer_id: p.volunteer_id,
          volunteer_name: volunteer
            ? `${volunteer.first_name} ${volunteer.last_name}`
            : 'Unknown',
          roll_number: volunteer?.roll_number || '',
          branch: volunteer?.branch || '',
          year: volunteer?.year || '',
          participation_status: p.participation_status || 'registered',
          hours_attended: p.hours_attended || 0,
          attendance_date: p.attendance_date,
          registration_date: p.registration_date,
          notes: p.notes,
        }
      })
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch event participants'
      console.error('Error fetching event participants:', errorMessage)
      return []
    }
  }

  // Update a single participant's attendance status
  const updateParticipationStatus = async (
    params: UpdateAttendanceParams
  ): Promise<{ error: string | null }> => {
    try {
      const updateData: any = {
        participation_status: params.status,
        updated_at: new Date().toISOString(),
      }

      if (params.hoursAttended !== undefined) {
        updateData.hours_attended = params.hoursAttended
      }

      if (params.notes !== undefined) {
        updateData.notes = params.notes
      }

      // Set attendance_date if marking as present/partially_present
      if (['present', 'partially_present'].includes(params.status)) {
        updateData.attendance_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('event_participation')
        .update(updateData)
        .eq('id', params.participantId)

      if (error) throw error

      return { error: null }
    } catch (err: any) {
      console.error('Error updating participation status:', err)
      return { error: err?.message || 'Failed to update attendance' }
    }
  }

  // Bulk mark attendance for multiple volunteers
  const bulkMarkAttendance = async (
    params: BulkAttendanceParams
  ): Promise<{ count: number; error: string | null }> => {
    try {
      if (params.volunteerIds.length === 0) {
        return { count: 0, error: null }
      }

      const updateData: any = {
        participation_status: params.status,
        hours_attended: params.hoursAttended,
        updated_at: new Date().toISOString(),
      }

      if (params.notes) {
        updateData.notes = params.notes
      }

      if (['present', 'partially_present'].includes(params.status)) {
        updateData.attendance_date = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('event_participation')
        .update(updateData)
        .eq('event_id', params.eventId)
        .in('volunteer_id', params.volunteerIds)
        .select()

      if (error) throw error

      return { count: data?.length || 0, error: null }
    } catch (err: any) {
      console.error('Error bulk marking attendance:', err)
      return { count: 0, error: err?.message || 'Failed to mark attendance' }
    }
  }

  // Register a volunteer for an event
  const registerVolunteerForEvent = async (
    eventId: string,
    volunteerId: string
  ): Promise<{ error: string | null }> => {
    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from('event_participation')
        .select('id')
        .eq('event_id', eventId)
        .eq('volunteer_id', volunteerId)
        .maybeSingle()

      if (existing) {
        return { error: 'Already registered for this event' }
      }

      const { error } = await supabase
        .from('event_participation')
        .insert({
          event_id: eventId,
          volunteer_id: volunteerId,
          participation_status: 'registered',
          hours_attended: 0,
          registration_date: new Date().toISOString(),
          recorded_by_volunteer_id: volunteerId,
        })

      if (error) throw error

      return { error: null }
    } catch (err: any) {
      console.error('Error registering for event:', err)
      return { error: err?.message || 'Failed to register for event' }
    }
  }

  // Unregister from an event
  const unregisterFromEvent = async (
    participantId: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('event_participation')
        .delete()
        .eq('id', participantId)

      if (error) throw error

      return { error: null }
    } catch (err: any) {
      console.error('Error unregistering from event:', err)
      return { error: err?.message || 'Failed to unregister from event' }
    }
  }

  useEffect(() => {
    fetchAttendanceData()
  }, [])

  return {
    attendanceRecords,
    loading,
    error,
    refetch: fetchAttendanceData,
    getEventParticipants,
    updateParticipationStatus,
    bulkMarkAttendance,
    registerVolunteerForEvent,
    unregisterFromEvent,
  }
}
