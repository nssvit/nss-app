'use client'

import { useState, useEffect } from 'react'
import type { EventWithStats, EventParticipationWithVolunteer } from '@/types'
import { getEvents } from '@/app/actions/events'
import { getEventParticipants, syncAttendance } from '@/app/actions/attendance'

export function useAttendance() {
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const data = await getEvents()
        if (!ignore) setEvents(data)
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        console.error('Failed to load events:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  return { events, loading }
}

export function useAttendanceManager(eventId: string | null) {
  const [participants, setParticipants] = useState<EventParticipationWithVolunteer[]>([])
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({})

  useEffect(() => {
    let ignore = false
    async function loadEvents() {
      try {
        const data = await getEvents()
        if (!ignore) setEvents(data)
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        console.error('Failed to load events:', err)
      } finally {
        if (!ignore && !eventId) setLoading(false)
      }
    }
    loadEvents()
    return () => { ignore = true }
  }, [eventId])

  useEffect(() => {
    let ignore = false
    async function loadParticipants() {
      if (!eventId) {
        setParticipants([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const data = await getEventParticipants(eventId)
        if (ignore) return
        setParticipants(data)
        const initial: Record<string, 'present' | 'absent'> = {}
        data.forEach((p) => {
          initial[p.id] = p.participationStatus === 'absent' ? 'absent' : 'present'
        })
        setAttendanceMap(initial)
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        console.error('Failed to load participants:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadParticipants()
    return () => { ignore = true }
  }, [eventId])

  const toggleAttendance = (participationId: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [participationId]: prev[participationId] === 'present' ? 'absent' : 'present',
    }))
  }

  const markAllPresent = () => {
    const updated: Record<string, 'present' | 'absent'> = {}
    participants.forEach((p) => {
      updated[p.id] = 'present'
    })
    setAttendanceMap(updated)
  }

  const markAllAbsent = () => {
    const updated: Record<string, 'present' | 'absent'> = {}
    participants.forEach((p) => {
      updated[p.id] = 'absent'
    })
    setAttendanceMap(updated)
  }

  const submitAttendance = async () => {
    if (!eventId) return
    const presentIds = Object.entries(attendanceMap)
      .filter(([, status]) => status === 'present')
      .map(([id]) => {
        const participant = participants.find((p) => p.id === id)
        return participant?.volunteerId
      })
      .filter(Boolean) as string[]

    await syncAttendance(eventId, presentIds)
  }

  return {
    events,
    participants,
    loading,
    attendanceMap,
    toggleAttendance,
    markAllPresent,
    markAllAbsent,
    submitAttendance,
  }
}
