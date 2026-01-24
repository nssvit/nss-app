'use client'

/**
 * EventsPage Component
 * Uses Server Actions via hooks (full Drizzle consistency)
 */

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useEvents } from '@/hooks/useEvents'
import { useCategories } from '@/hooks/useCategories'
import { EventCard } from './EventCard'
import { EventModal } from './EventModal'
import { EventParticipantsModal } from './EventParticipantsModal'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from './Toast'

interface EventDisplay {
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
  participant_avatars?: { avatar: string; alt: string }[]
}

export function EventsPage() {
  const { currentUser, hasAnyRole } = useAuth()
  const layout = useResponsiveLayout()
  const { toasts, removeToast, success, error: showError, info } = useToast()

  // Use hooks for data fetching (Server Actions -> Drizzle)
  const {
    events: rawEvents,
    loading: eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch,
  } = useEvents()
  const { categories: rawCategories, loading: categoriesLoading } = useCategories()

  const loading = eventsLoading || categoriesLoading

  // Transform events to display format
  const events: EventDisplay[] = useMemo(() => {
    return (rawEvents || []).map((e: any) => ({
      id: e.id,
      event_name: e.eventName || e.event_name || e.name || '',
      event_description: e.eventDescription || e.event_description || e.description || '',
      event_date: e.startDate || e.event_date || e.start_date || '',
      declared_hours: e.declaredHours || e.declared_hours || 0,
      category_name: e.category?.categoryName || e.category?.category_name || 'General',
      created_by_name: e.createdBy
        ? `${e.createdBy.firstName || ''} ${e.createdBy.lastName || ''}`.trim()
        : 'Unknown',
      participant_count: e.participantCount || 0,
      is_active: e.eventStatus === 'upcoming' || e.eventStatus === 'ongoing' || e.isActive,
      created_at: e.createdAt || e.created_at || '',
      participant_avatars: [],
    }))
  }, [rawEvents])

  // Transform categories
  const categories = useMemo(() => {
    return (rawCategories || []).map((c: any) => ({
      id: c.id?.toString() || '',
      category_name: c.categoryName || c.category_name || '',
      is_active: c.isActive ?? c.is_active ?? true,
    }))
  }, [rawCategories])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventDisplay | null>(null)
  const [participantsModalEvent, setParticipantsModalEvent] = useState<EventDisplay | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const eventsPerPage = 12

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.event_description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter) {
      filtered = filtered.filter((event) => event.category_name === categoryFilter)
    }

    if (sessionFilter) {
      filtered = filtered.filter((event) => {
        const eventYear = new Date(event.event_date).getFullYear()
        return eventYear.toString() === sessionFilter
      })
    }

    return filtered
  }, [events, searchTerm, categoryFilter, sessionFilter])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, sessionFilter])

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

      const category = categories.find(
        (c) =>
          c.category_name === eventData.eventCategory ||
          c.category_name.toLowerCase() === eventData.eventCategory?.toLowerCase()
      )

      if (!category) {
        showError(`Category "${eventData.eventCategory}" not found`)
        return
      }

      const result = await createEvent({
        eventName: eventData.eventName,
        description: eventData.eventDescription || '',
        startDate: eventData.eventDate,
        endDate: eventData.eventDate,
        declaredHours: parseInt(eventData.declaredHours) || 1,
        categoryId: parseInt(category.id),
        location: eventData.eventLocation || null,
        eventStatus: 'planned',
      })

      if (result.error) {
        showError(result.error)
        return
      }

      success(`Event "${eventData.eventName}" created successfully!`)
      setIsModalOpen(false)
    } catch (error: any) {
      console.error('Error creating event:', error)
      showError(error?.message || 'Failed to create event')
    }
  }

  const handleEditEvent = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    if (event) {
      setEditingEvent(event)
      setIsModalOpen(true)
    }
  }

  const handleUpdateEvent = async (eventData: any) => {
    if (!editingEvent) return

    try {
      info('Updating event...')

      const category = categories.find(
        (c) =>
          c.category_name === eventData.eventCategory ||
          c.category_name.toLowerCase() === eventData.eventCategory?.toLowerCase()
      )

      if (!category) {
        showError(`Category "${eventData.eventCategory}" not found`)
        return
      }

      const result = await updateEvent(editingEvent.id, {
        eventName: eventData.eventName,
        description: eventData.eventDescription || '',
        startDate: eventData.eventDate,
        declaredHours: parseInt(eventData.declaredHours) || 1,
        categoryId: parseInt(category.id),
        location: eventData.eventLocation || null,
      })

      if (result.error) {
        showError(result.error)
        return
      }

      success(`Event "${eventData.eventName}" updated successfully!`)
      setIsModalOpen(false)
      setEditingEvent(null)
    } catch (error: any) {
      console.error('Error updating event:', error)
      showError(error?.message || 'Failed to update event')
    }
  }

  const handleViewParticipants = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    if (event) {
      setParticipantsModalEvent(event)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const result = await deleteEvent(eventId)
      if (result.error) {
        showError(result.error)
      } else {
        success('Event deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      showError('Failed to delete event')
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
      { value: (currentYear - 2).toString(), label: `${currentYear - 2}-${currentYear - 1}` },
    ]
  }

  if (loading) {
    return (
      <div
        className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
      >
        <div className="flex flex-wrap items-center gap-3 mb-6 px-1">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className={`grid ${layout.getGridColumns()} gap-4 mb-8`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="card-glass rounded-xl p-4 h-[280px] flex flex-col"
            >
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
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div
        className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
      >
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
        <div
          className={`flex flex-wrap items-center gap-3 mb-6 ${layout.isMobile ? 'px-0' : 'px-1'}`}
        >
          <select
            className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible flex-1 min-w-0"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
          >
            {getSessionOptions().map((option, index) => (
              <option key={`session-${index}`} value={option.value}>
                {option.label}
              </option>
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

          <button className="btn btn-sm btn-ghost" onClick={clearFilters}>
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
                day: 'numeric',
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
                  <i className="fas fa-plus mr-2"></i>Create First Event
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
          title={editingEvent ? 'Edit Event' : 'Create New Event'}
          categories={categories.map((c) => c.category_name)}
          initialData={
            editingEvent
              ? {
                  eventName: editingEvent.event_name,
                  eventDate: editingEvent.event_date?.split('T')[0] || '',
                  declaredHours: editingEvent.declared_hours?.toString() || '',
                  eventCategory: editingEvent.category_name || '',
                  academicSession: new Date(editingEvent.event_date).getFullYear().toString(),
                  eventLocation: '',
                  eventDescription: editingEvent.event_description || '',
                }
              : undefined
          }
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
