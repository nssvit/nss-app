'use client'

import { useState, useEffect } from 'react'
import type { EventWithStats, EventParticipationWithVolunteer } from '@/types'
import { getEvents, getEventParticipants } from '@/lib/mock-api'

export function useAttendance() {
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getEvents()
      setEvents(data)
      setLoading(false)
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
      const data = await getEvents()
      setEvents(data)
      if (!eventId) setLoading(false)
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
      const data = await getEventParticipants(eventId)
      setParticipants(data)
      const initial: Record<string, 'present' | 'absent'> = {}
      data.forEach((p) => {
        initial[p.id] = p.participationStatus === 'absent' ? 'absent' : 'present'
      })
      setAttendanceMap(initial)
      setLoading(false)
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
    // In production, this would call an API to save attendance
    // For now, just simulate success
    await new Promise((r) => setTimeout(r, 300))
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
