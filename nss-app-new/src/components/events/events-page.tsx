'use client'

import { useState, useMemo, useCallback } from 'react'
import { LayoutGrid, List, Sparkles } from 'lucide-react'
import { useEvents } from '@/hooks/use-events'
import { useAuth } from '@/contexts/auth-context'
import { usePagination } from '@/hooks/use-pagination'
import { PageHeader } from '@/components/page-header'
import { TablePagination } from '@/components/table-pagination'
import { EventFilters, type EventFilterValues } from './event-filters'
import { EventFormModal } from './event-form'
import { EventsGrid } from './events-grid'
import { EventsTable } from './events-table'
import { EventDetailModal } from './event-detail'
import { EventCard } from './event-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { EventWithStats, EventCategory } from '@/types'

type Filters = EventFilterValues

const UPCOMING_STATUSES = new Set(['planned', 'registration_open', 'registration_closed', 'ongoing'])

interface EventsPageProps {
  initialData?: {
    events: EventWithStats[]
    categories: EventCategory[]
  }
}

export function EventsPage({ initialData }: EventsPageProps) {
  const { events, categories, loading, refresh } = useEvents(initialData)
  const { hasAnyRole } = useAuth()
  const canManageEvents = hasAnyRole(['admin', 'head'])
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categoryId: null,
    status: null,
    attendance: 'all',
  })
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedEvent, setSelectedEvent] = useState<EventWithStats | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const matchesName = event.eventName.toLowerCase().includes(query)
        const matchesLocation = event.location?.toLowerCase().includes(query) ?? false
        if (!matchesName && !matchesLocation) return false
      }
      if (filters.categoryId !== null && event.categoryId !== filters.categoryId) {
        return false
      }
      if (filters.status !== null && event.eventStatus !== filters.status) {
        return false
      }
      if (filters.attendance === 'attended') {
        const s = event.userParticipationStatus
        if (s !== 'present' && s !== 'partially_present') return false
      } else if (filters.attendance === 'not_attended') {
        const s = event.userParticipationStatus
        if (s === 'present' || s === 'partially_present') return false
      }
      return true
    })
  }, [events, filters])

  // Split into upcoming (horizontal) and rest (grid)
  const upcomingEvents = useMemo(
    () => filteredEvents.filter((e) => UPCOMING_STATUSES.has(e.eventStatus)),
    [filteredEvents]
  )
  const restEvents = useMemo(
    () => filteredEvents.filter((e) => !UPCOMING_STATUSES.has(e.eventStatus)),
    [filteredEvents]
  )

  const { paginatedItems, currentPage, totalPages, totalItems, setCurrentPage } = usePagination(restEvents, 20)

  const handleEventClick = useCallback((event: EventWithStats) => {
    setSelectedEvent(event)
    setDetailOpen(true)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Events" description="Manage and browse NSS events." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Events"
        description="Manage and browse NSS events."
        actions={canManageEvents ? <EventFormModal categories={categories} onSuccess={refresh} /> : undefined}
      />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <EventFilters categories={categories} onFilterChange={setFilters} />
        </div>
        <div className="hidden items-center rounded-md border sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-9 w-9 rounded-r-none', view === 'grid' && 'bg-muted')}
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-9 w-9 rounded-l-none', view === 'list' && 'bg-muted')}
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Upcoming events — horizontal scroll */}
      {upcomingEvents.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-4 w-4" />
            <h2 className="text-sm font-semibold">Upcoming & Active</h2>
            <span className="text-muted-foreground text-xs">({upcomingEvents.length})</span>
          </div>
          <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-0 sm:px-0">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="w-[280px] shrink-0 sm:w-[300px]">
                <EventCard
                  event={event}
                  onClick={canManageEvents ? () => handleEventClick(event) : undefined}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past / other events — normal grid */}
      {(paginatedItems.length > 0 || upcomingEvents.length === 0) && (
        <section className="space-y-3">
          {upcomingEvents.length > 0 && (
            <h2 className="text-sm font-semibold">Past Events</h2>
          )}
          {view === 'grid' ? (
            <EventsGrid
              events={paginatedItems}
              onEventClick={canManageEvents ? handleEventClick : undefined}
            />
          ) : (
            <EventsTable
              events={paginatedItems}
              onEventClick={canManageEvents ? handleEventClick : undefined}
            />
          )}
        </section>
      )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
      />

      {canManageEvents && (
        <EventDetailModal
          event={selectedEvent}
          categories={categories}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onEventUpdated={refresh}
        />
      )}
    </div>
  )
}
