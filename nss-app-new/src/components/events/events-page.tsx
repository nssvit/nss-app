'use client'

import { useState, useMemo } from 'react'
import { useEvents } from '@/hooks/use-events'
import { PageHeader } from '@/components/page-header'
import { EventFilters } from './event-filters'
import { EventFormModal } from './event-form-modal'
import { EventsGrid } from './events-grid'
import { Skeleton } from '@/components/ui/skeleton'
import type { EventWithStats, EventCategory } from '@/types'

interface Filters {
  search: string
  categoryId: number | null
  status: string | null
}

interface EventsPageProps {
  initialData?: {
    events: EventWithStats[]
    categories: EventCategory[]
  }
}

export function EventsPage({ initialData }: EventsPageProps) {
  const { events, categories, loading } = useEvents(initialData)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categoryId: null,
    status: null,
  })

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
        actions={<EventFormModal categories={categories} />}
      />
      <EventFilters categories={categories} onFilterChange={setFilters} />
      <EventsGrid events={filteredEvents} />
    </div>
  )
}
