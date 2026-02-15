'use client'

import { useState, useMemo } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { useEvents } from '@/hooks/use-events'
import { useAuth } from '@/contexts/auth-context'
import { PageHeader } from '@/components/page-header'
import { EventFilters, type EventFilterValues } from './event-filters'
import { EventFormModal } from './event-form-modal'
import { EventsGrid } from './events-grid'
import { EventsTable } from './events-table'
import { EventDetailModal } from './event-detail-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { EventWithStats, EventCategory } from '@/types'

type Filters = EventFilterValues

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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Events" description="Manage and browse NSS events." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Manage and browse NSS events."
        actions={canManageEvents ? <EventFormModal categories={categories} onSuccess={refresh} /> : undefined}
      />
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <EventFilters categories={categories} onFilterChange={setFilters} />
        </div>
        <div className="flex items-center rounded-md border">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 rounded-r-none', view === 'grid' && 'bg-muted')}
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 rounded-l-none', view === 'list' && 'bg-muted')}
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {view === 'grid' ? (
        <EventsGrid
          events={filteredEvents}
          onEventClick={
            canManageEvents
              ? (event) => {
                  setSelectedEvent(event)
                  setDetailOpen(true)
                }
              : undefined
          }
        />
      ) : (
        <EventsTable
          events={filteredEvents}
          onEventClick={
            canManageEvents
              ? (event) => {
                  setSelectedEvent(event)
                  setDetailOpen(true)
                }
              : undefined
          }
        />
      )}

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
