'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Event, EventWithDetails } from '@/types'

export function useEvents() {
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_categories(
            id,
            category_name,
            display_name,
            description,
            color_hex
          ),
          volunteers!events_created_by_volunteer_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          event_participation(
            id,
            volunteer_id,
            participation_status,
            hours_attended,
            volunteers(
              id,
              first_name,
              last_name,
              profile_pic
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to match the existing interface
      const transformedEvents: EventWithDetails[] = (data || []).map(event => ({
        ...event,
        category: event.event_categories,
        created_by: event.volunteers,
        participants: event.event_participation || [],
        // Legacy fields for compatibility
        participantCount: event.event_participation?.length || 0,
        capacity: event.max_participants ? `${event.event_participation?.length || 0}/${event.max_participants}` : undefined
      }))

      setEvents(transformedEvents)
      setError(null)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const addEvent = async (eventData: {
    event_name: string
    description?: string
    start_date: string
    end_date?: string
    location?: string
    max_participants?: number
    min_participants?: number
    registration_deadline?: string
    category_id?: string
    created_by_volunteer_id: string
  }) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (error) throw error

      await fetchEvents() // Refresh the list
      return { data, error: null }
    } catch (err) {
      console.error('Error adding event:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to add event' }
    }
  }

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchEvents() // Refresh the list
      return { data, error: null }
    } catch (err) {
      console.error('Error updating event:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update event' }
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      await fetchEvents() // Refresh the list
      return { error: null }
    } catch (err) {
      console.error('Error deleting event:', err)
      return { error: err instanceof Error ? err.message : 'Failed to delete event' }
    }
  }

  const registerForEvent = async (eventId: string, volunteerId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_participation')
        .insert({
          event_id: eventId,
          volunteer_id: volunteerId,
          participation_status: 'registered'
        })
        .select()
        .single()

      if (error) throw error

      await fetchEvents() // Refresh the list
      return { data, error: null }
    } catch (err) {
      console.error('Error registering for event:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to register for event' }
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return {
    events,
    loading,
    error,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    registerForEvent
  }
}