'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { EventCard } from './EventCard'
import { EventModal } from './EventModal'
import { EventParticipantsModal } from './EventParticipantsModal'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from './Toast'

interface EventParticipantAvatar {
  avatar: string
  alt: string
}

interface Event {
  id: string
  event_name: string
  event_description: string
  event_date: string
  declared_hours: number
  category_name: string
  created_by_name: string
  participant_count: number
  is_active: boolean
  created_at: string
  participant_avatars?: EventParticipantAvatar[]
}

interface EventCategory {
  id: string
  category_name: string
  is_active: boolean
}

export function EventsPage() {
  const { currentUser, hasAnyRole } = useAuth()
  const layout = useResponsiveLayout()
  const { toasts, removeToast, success, error: showError, info } = useToast()

  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [participantsModalEvent, setParticipantsModalEvent] = useState<Event | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const eventsPerPage = 12

  useEffect(() => {
    // ⚡ Load events and categories in parallel for faster loading
    Promise.all([loadEvents(), loadCategories()])
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, categoryFilter, sessionFilter])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase.rpc('get_events_with_stats')

      if (error) {
        console.error('Error loading events:', error)
        return
      }

      // Fetch participant avatars for events that have participants
      const eventsWithAvatars = await Promise.all(
        (data || []).map(async (event: Event) => {
          try {
            if (event.participant_count === 0) {
              return { ...event, participant_avatars: [] }
            }

            // Get participation records first
            const { data: participations } = await supabase
              .from('event_participation')
              .select('volunteer_id')
              .eq('event_id', event.id)
              .limit(3)

            if (!participations || participations.length === 0) {
              return { ...event, participant_avatars: [] }
            }

            // Get volunteer details
            const volunteerIds = participations.map(p => p.volunteer_id).filter(Boolean)
            const { data: volunteers } = await supabase
              .from('volunteers')
              .select('first_name, last_name, profile_pic')
              .in('id', volunteerIds)

            const avatars: EventParticipantAvatar[] = (volunteers || [])
              .map((v: any) => ({
                avatar: v.profile_pic || '',
                alt: `${v.first_name} ${v.last_name}`
              }))
              .filter((a: EventParticipantAvatar) => a.avatar) // Only include those with profile pics

            return { ...event, participant_avatars: avatars }
          } catch {
            return { ...event, participant_avatars: [] }
          }
        })
      )

      setEvents(eventsWithAvatars)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('event_categories')
        .select('id, category_name, is_active')
        .eq('is_active', true)
        .order('category_name')

      if (error) {
        console.error('Error loading categories:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(event => event.category_name === categoryFilter)
    }

    // Session filter (by year)
    if (sessionFilter) {
      filtered = filtered.filter(event => {
        const eventYear = new Date(event.event_date).getFullYear()
        return eventYear.toString() === sessionFilter
      })
    }

    setFilteredEvents(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
    setSessionFilter('')
  }

  const handleCreateEvent = async (eventData: any) => {
    try {
      info('Creating event...')

      if (!currentUser) {
        showError('You must be logged in to create events')
        return
      }

      // Verify user has volunteer_id
      if (!currentUser.volunteer_id && !currentUser.id) {
        showError('User account not properly set up. Please contact admin.')
        console.error('Current user:', currentUser)
        return
      }

      console.log('Available categories:', categories)
      console.log('Selected category:', eventData.eventCategory)

      // Find category ID (try exact match first, then case-insensitive)
      let category = categories.find(c => c.category_name === eventData.eventCategory)
      if (!category) {
        category = categories.find(c => c.category_name.toLowerCase() === eventData.eventCategory.toLowerCase())
      }

      if (!category) {
        showError(`Category "${eventData.eventCategory}" not found. Available: ${categories.map(c => c.category_name).join(', ')}`)
        return
      }

      // Parse the date and create start/end dates
      const eventDate = new Date(eventData.eventDate)
      const declaredHours = parseInt(eventData.declaredHours) || 1

      // Use volunteer_id if available, otherwise id
      const volunteerUserId = currentUser.volunteer_id || currentUser.id

      console.log('Creating event with data:', {
        name: eventData.eventName,
        category: category.category_name,
        category_id: category.id,
        date: eventDate.toISOString().split('T')[0],
        hours: declaredHours,
        created_by: volunteerUserId
      })

      // Prepare insert data
      const insertData: any = {
        name: eventData.eventName,
        event_name: eventData.eventName, // Compatibility column
        description: eventData.eventDescription || '',
        start_date: eventDate.toISOString().split('T')[0],
        end_date: eventDate.toISOString().split('T')[0],
        event_date: eventData.eventDate,
        declared_hours: declaredHours,
        category_id: parseInt(category.id),
        location: eventData.eventLocation || null,
        event_status: 'planned',
        created_by_volunteer_id: volunteerUserId
      }

      // Add optional fields
      if (eventData.minParticipants) {
        insertData.min_participants = parseInt(eventData.minParticipants)
      }
      if (eventData.maxParticipants) {
        insertData.max_participants = parseInt(eventData.maxParticipants)
      }
      if (eventData.registrationDeadline) {
        insertData.registration_deadline = eventData.registrationDeadline
      }

      // Insert directly into events table
      const { data, error } = await supabase
        .from('events')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating event:', error)
        showError(`Failed to create event: ${error.message}`)
        return
      }

      console.log('Event created successfully:', data)
      success(`Event "${eventData.eventName}" created successfully!`)

      // Reload events
      await loadEvents()
      setIsModalOpen(false)
    } catch (error: any) {
      console.error('Error creating event:', error)
      showError(error?.message || 'Failed to create event')
    }
  }

  const handleEditEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      setEditingEvent(event)
      setIsModalOpen(true)
    }
  }

  const handleUpdateEvent = async (eventData: any) => {
    if (!editingEvent) return

    try {
      info('Updating event...')

      // Find category ID
      let category = categories.find(c => c.category_name === eventData.eventCategory)
      if (!category) {
        category = categories.find(c => c.category_name.toLowerCase() === eventData.eventCategory.toLowerCase())
      }

      if (!category) {
        showError(`Category "${eventData.eventCategory}" not found`)
        return
      }

      const updateData: any = {
        name: eventData.eventName,
        event_name: eventData.eventName,
        description: eventData.eventDescription || '',
        event_date: eventData.eventDate,
        declared_hours: parseInt(eventData.declaredHours) || 1,
        category_id: parseInt(category.id),
        location: eventData.eventLocation || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', editingEvent.id)

      if (error) {
        console.error('Error updating event:', error)
        showError(`Failed to update event: ${error.message}`)
        return
      }

      success(`Event "${eventData.eventName}" updated successfully!`)
      await loadEvents()
      setIsModalOpen(false)
      setEditingEvent(null)
    } catch (error: any) {
      console.error('Error updating event:', error)
      showError(error?.message || 'Failed to update event')
    }
  }

  const handleViewParticipants = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      setParticipantsModalEvent(event)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: false })
        .eq('id', eventId)

      if (error) {
        console.error('Error deleting event:', error)
        return
      }

      // Reload events
      await loadEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage)
  const startIndex = (currentPage - 1) * eventsPerPage
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getSessionOptions = () => {
    const currentYear = new Date().getFullYear()
    return [
      { value: '', label: 'All Sessions' },
      { value: currentYear.toString(), label: `${currentYear}-${currentYear + 1}` },
      { value: (currentYear - 1).toString(), label: `${currentYear - 1}-${currentYear}` },
      { value: (currentYear - 2).toString(), label: `${currentYear - 2}-${currentYear - 1}` }
    ]
  }

  // ... (inside component)

  if (loading) {
    return (
      <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}>
        {/* Filters Skeleton */}
        <div className="flex flex-wrap items-center gap-3 mb-6 px-1">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>

        {/* Events Grid Skeleton */}
        <div className={`grid ${layout.getGridColumns()} gap-4 mb-8`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="card-glass rounded-xl p-4 h-[280px] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex gap-2 mb-auto">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-700/20">
                <div className="flex -space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full border-2 border-gray-800" />
                  <Skeleton className="h-6 w-6 rounded-full border-2 border-gray-800" />
                  <Skeleton className="h-6 w-6 rounded-full border-2 border-gray-800" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}>
        {/* Mobile Search Bar */}
        {layout.isMobile && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search events..."
              className="input-dark text-sm rounded-lg py-3 px-4 pl-10 focus:outline-none placeholder-gray-500 focus-visible w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div className={`flex flex-wrap items-center gap-3 mb-6 ${layout.isMobile ? 'px-0' : 'px-1'}`}>
        <select
          className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible flex-1 min-w-0"
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
        >
          {getSessionOptions().map((option, index) => (
            <option key={`session-${index}`} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible flex-1 min-w-0"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category, index) => (
            <option key={`cat-${category.id || index}`} value={category.category_name}>
              {category.category_name}
            </option>
          ))}
        </select>

        <button className="btn btn-sm btn-secondary flex items-center gap-2">
          <i className="fas fa-filter fa-sm"></i>
          {!layout.isMobile && <span>Filter</span>}
        </button>

        <button
          className="btn btn-sm btn-ghost"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-body-sm" style={{ color: 'var(--text-tertiary)' }}>
        Showing {paginatedEvents.length} of {filteredEvents.length} events
        {searchTerm && ` for "${searchTerm}"`}
      </div>

      {/* Events Grid */}
      <div className={`grid ${layout.getGridColumns()} gap-4 mb-8`}>
        {paginatedEvents.map((event, index) => (
          <EventCard
            key={`event-${event.id || index}`}
            title={event.event_name}
            date={new Date(event.event_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
            description={event.event_description}
            category={event.category_name}
            hours={event.declared_hours.toString()}
            participants={event.participant_avatars || []}
            participantCount={event.participant_count}
            onEdit={() => handleEditEvent(event.id)}
            onViewParticipants={() => handleViewParticipants(event.id)}
            onDelete={() => handleDeleteEvent(event.id)}
            createdBy={event.created_by_name}
            canEdit={hasAnyRole(['admin', 'program_officer', 'event_lead'])}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <EmptyState
          icon="fa-calendar-times"
          title="No Events Found"
          description={
            searchTerm || categoryFilter || sessionFilter
              ? 'Try adjusting your filters to see more events.'
              : 'No events have been created yet.'
          }
          size="lg"
          action={
            hasAnyRole(['admin', 'program_officer', 'event_lead']) ? (
              <button
                onClick={() => {
                  setEditingEvent(null)
                  setIsModalOpen(true)
                }}
                className="btn btn-md btn-primary"
              >
                <i className="fas fa-plus mr-2"></i>
                Create First Event
              </button>
            ) : undefined
          }
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 md:mt-6 safe-area-bottom">
          <nav className={`flex ${layout.isMobile ? 'gap-1' : 'gap-2'}`}>
            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              {layout.isMobile ? '‹' : 'Previous'}
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return (
                <button
                  key={`page-${i}`}
                  className={`btn btn-sm ${currentPage === pageNumber ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => goToPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              )
            })}

            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              {layout.isMobile ? '›' : 'Next'}
            </button>
          </nav>
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEvent(null)
        }}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        title={editingEvent ? "Edit Event" : "Create New Event"}
        categories={categories.map(c => c.category_name)}
        initialData={editingEvent ? {
          eventName: editingEvent.event_name,
          eventDate: editingEvent.event_date?.split('T')[0] || '',
          declaredHours: editingEvent.declared_hours?.toString() || '',
          eventCategory: editingEvent.category_name || '',
          academicSession: new Date(editingEvent.event_date).getFullYear().toString(),
          eventLocation: '',
          eventDescription: editingEvent.event_description || '',
        } : undefined}
      />

      {/* Event Participants Modal */}
      {participantsModalEvent && (
        <EventParticipantsModal
          isOpen={!!participantsModalEvent}
          onClose={() => setParticipantsModalEvent(null)}
          eventId={participantsModalEvent.id}
          eventName={participantsModalEvent.event_name}
        />
      )}
      </div>
    </>
  )
}