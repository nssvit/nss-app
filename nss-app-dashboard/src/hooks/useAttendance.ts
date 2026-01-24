'use client'

/**
 * Attendance Hook
 *
 * Fetches and manages attendance data using Server Actions (Drizzle ORM)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAttendanceSummary,
  getEventParticipants as fetchParticipants,
  markAttendance as markAttendanceAction,
  syncAttendance as syncAttendanceAction,
  updateParticipationStatus as updateParticipationAction,
  bulkMarkAttendance as bulkMarkAttendanceAction,
  getEventsForAttendance as getEventsAction,
} from '@/app/actions/attendance'

// Raw database format (snake_case)
export interface AttendanceRecordRaw {
  event_id: string
  event_name: string
  event_date: Date | null
  category_name: string
  total_registered: number
  total_present: number
  total_absent: number
  attendance_rate: number
  total_hours: number
}

// Camel case format
export interface AttendanceRecord {
  eventId: string
  eventName: string
  eventDate: Date | null
  categoryName: string
  totalRegistered: number
  totalPresent: number
  totalAbsent: number
  attendanceRate: number
  totalHours: number
}

// Raw database format (snake_case)
export interface EventParticipantRaw {
  participant_id: string
  volunteer_id: string
  volunteer_name: string
  roll_number: string
  branch: string
  year: string
  participation_status: string
  hours_attended: number
  attendance_date: Date | null
  registration_date: Date | null
  notes: string | null
}

// Camel case format
export interface EventParticipant {
  participantId: string
  volunteerId: string
  volunteerName: string
  rollNumber: string
  branch: string
  year: string
  participationStatus: string
  hoursAttended: number
  attendanceDate: Date | null
  registrationDate: Date | null
  notes: string | null
  // Also expose snake_case for backward compatibility
  participant_id: string
  volunteer_id: string
  volunteer_name: string
  roll_number: string
  participation_status: string
  hours_attended: number
}

export interface EventForAttendance {
  id: string
  event_name: string
  event_date: string
  declared_hours: number
  location: string | null
}

export type ParticipationStatus = 'registered' | 'present' | 'absent' | 'partially_present' | 'excused'

export interface UseAttendanceReturn {
  attendanceRecords: AttendanceRecordRaw[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getEventParticipants: (eventId: string) => Promise<EventParticipant[]>
  markAttendance: (eventId: string, volunteerIds: string[], hours?: number) => Promise<{ error: string | null }>
  syncAttendance: (eventId: string, volunteerIds: string[]) => Promise<{ error: string | null }>
  updateParticipationStatus: (params: {
    participantId: string
    status: string
    hoursAttended?: number
    notes?: string
  }) => Promise<{ error: string | null }>
  bulkMarkAttendance: (params: {
    eventId: string
    volunteerIds: string[]
    status: string
    hoursAttended?: number
    notes?: string
  }) => Promise<{ error: string | null; count?: number }>
  getEventsForAttendance: () => Promise<EventForAttendance[]>
}

export function useAttendance(): UseAttendanceReturn {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordRaw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getAttendanceSummary()
      setAttendanceRecords(data as AttendanceRecordRaw[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attendance data'
      console.error('[useAttendance] Error:', message)
      setError(message)
      setAttendanceRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleGetParticipants = useCallback(async (eventId: string): Promise<EventParticipant[]> => {
    try {
      const data = await fetchParticipants(eventId)
      // Transform to include both formats for backward compatibility
      return (data as any[]).map((p) => ({
        // Camel case
        participantId: p.participant_id || p.participantId || p.id,
        volunteerId: p.volunteer_id || p.volunteerId,
        volunteerName: p.volunteer_name || p.volunteerName,
        rollNumber: p.roll_number || p.rollNumber,
        branch: p.branch,
        year: p.year,
        participationStatus: p.participation_status || p.participationStatus,
        hoursAttended: p.hours_attended ?? p.hoursAttended ?? 0,
        attendanceDate: p.attendance_date || p.attendanceDate,
        registrationDate: p.registration_date || p.registrationDate,
        notes: p.notes,
        // Snake case (backward compatibility)
        participant_id: p.participant_id || p.participantId || p.id,
        volunteer_id: p.volunteer_id || p.volunteerId,
        volunteer_name: p.volunteer_name || p.volunteerName,
        roll_number: p.roll_number || p.rollNumber,
        participation_status: p.participation_status || p.participationStatus,
        hours_attended: p.hours_attended ?? p.hoursAttended ?? 0,
      }))
    } catch (err) {
      console.error('[useAttendance] Error fetching participants:', err)
      return []
    }
  }, [])

  const handleMarkAttendance = useCallback(
    async (eventId: string, volunteerIds: string[], hours?: number) => {
      try {
        await markAttendanceAction(eventId, volunteerIds, hours)
        await fetchAttendanceData()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to mark attendance' }
      }
    },
    [fetchAttendanceData]
  )

  const handleSyncAttendance = useCallback(
    async (eventId: string, volunteerIds: string[]) => {
      try {
        await syncAttendanceAction(eventId, volunteerIds)
        await fetchAttendanceData()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to sync attendance' }
      }
    },
    [fetchAttendanceData]
  )

  const handleUpdateParticipationStatus = useCallback(
    async (params: { participantId: string; status: string; hoursAttended?: number; notes?: string }) => {
      try {
        await updateParticipationAction(params.participantId, params.status, params.hoursAttended, params.notes)
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to update participation status' }
      }
    },
    []
  )

  const handleBulkMarkAttendance = useCallback(
    async (params: { eventId: string; volunteerIds: string[]; status: string; hoursAttended?: number; notes?: string }) => {
      try {
        const result = await bulkMarkAttendanceAction(params)
        await fetchAttendanceData()
        return { error: null, count: result.count }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to bulk mark attendance' }
      }
    },
    [fetchAttendanceData]
  )

  const handleGetEventsForAttendance = useCallback(async (): Promise<EventForAttendance[]> => {
    try {
      const data = await getEventsAction()
      return data
    } catch (err) {
      console.error('[useAttendance] Error fetching events:', err)
      return []
    }
  }, [])

  useEffect(() => {
    fetchAttendanceData()
  }, [fetchAttendanceData])

  return {
    attendanceRecords,
    loading,
    error,
    refetch: fetchAttendanceData,
    getEventParticipants: handleGetParticipants,
    markAttendance: handleMarkAttendance,
    syncAttendance: handleSyncAttendance,
    updateParticipationStatus: handleUpdateParticipationStatus,
    bulkMarkAttendance: handleBulkMarkAttendance,
    getEventsForAttendance: handleGetEventsForAttendance,
  }
}
