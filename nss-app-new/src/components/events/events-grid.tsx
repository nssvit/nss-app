import { Calendar } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { EventCard } from './event-card'
import type { EventWithStats } from '@/types'

interface EventsGridProps {
  events: EventWithStats[]
  onEventClick?: (event: EventWithStats) => void
}

export function EventsGrid({ events, onEventClick }: EventsGridProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No events found"
        description="No events match your current filters. Try adjusting your search or filters."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onClick={() => onEventClick?.(event)} />
      ))}
    </div>
  )
}
