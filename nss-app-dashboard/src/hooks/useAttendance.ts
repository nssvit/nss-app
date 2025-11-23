/**
 * Attendance Hook
 * Fetches and manages attendance data with real-time updates
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { setupDebouncedSubscription } from '@/lib/supabase-realtime'

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

export interface UseAttendanceReturn {
  attendanceRecords: AttendanceRecord[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getEventParticipants: (eventId: string) => Promise<EventParticipant[]>
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
      const { data, error } = await supabase.rpc('get_event_participants', {
        event_uuid: eventId,
      })

      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42883') {
          console.error(
            'Database function not found. Please run db/supabase_functions.sql in your Supabase SQL Editor.'
          )
          return []
        }
        throw new Error(error.message || 'Failed to fetch participants')
      }

      return (data || []) as EventParticipant[]
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch event participants'
      console.error('Error fetching event participants:', errorMessage)
      return []
    }
  }

  useEffect(() => {
    fetchAttendanceData()

    // Set up real-time subscriptions
    const cleanup = setupDebouncedSubscription(
      ['events', 'event_participation'],
      () => {
        fetchAttendanceData()
      },
      1000
    )

    return cleanup
  }, [])

  return {
    attendanceRecords,
    loading,
    error,
    refetch: fetchAttendanceData,
    getEventParticipants,
  }
}
