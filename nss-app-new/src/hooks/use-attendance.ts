'use client'

import { useState, useEffect } from 'react'
import type { EventWithStats, EventParticipationWithVolunteer } from '@/types'
import { getEvents } from '@/app/actions/events'
import { getEventParticipants, syncAttendance } from '@/app/actions/attendance'

export function useAttendance() {
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getEvents()
        setEvents(data)
      } catch (err) {
        console.error('Failed to load events:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { events, loading }
}

export function useAttendanceManager(eventId: string | null) {
  const [participants, setParticipants] = useState<EventParticipationWithVolunteer[]>([])
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({})

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents()
        setEvents(data)
      } catch (err) {
        console.error('Failed to load events:', err)
      } finally {
        if (!eventId) setLoading(false)
      }
    }
    loadEvents()
  }, [eventId])

  useEffect(() => {
    async function loadParticipants() {
      if (!eventId) {
        setParticipants([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const data = await getEventParticipants(eventId)
        setParticipants(data)
        const initial: Record<string, 'present' | 'absent'> = {}
        data.forEach((p) => {
          initial[p.id] = p.participationStatus === 'absent' ? 'absent' : 'present'
        })
        setAttendanceMap(initial)
      } catch (err) {
        console.error('Failed to load participants:', err)
      } finally {
        setLoading(false)
      }
    }
    loadParticipants()
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
