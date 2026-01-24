'use client'

/**
 * EventsGrid Component
 * Grid display of event cards
 */

import { EventCard } from '../EventCard'
import { Skeleton } from '../Skeleton'
import { EmptyState } from '../EmptyState'
import type { Event } from './types'

interface EventsGridProps {
  events: Event[]
  loading: boolean
  isMobile: boolean
  canManage: boolean
  onEdit: (event: Event) => void
  onViewParticipants: (event: Event) => void
  onRegister: (eventId: string) => void
}

export function EventsGrid({ events, loading, isMobile, canManage, onEdit, onViewParticipants, onRegister }: EventsGridProps) {
  if (loading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    )
  }

  if (events.length === 0) {
    return <EmptyState title="No events found" description="Try adjusting your filters or create a new event" icon="fas fa-calendar-times" />
  }

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={{
            id: event.id,
            event_name: event.eventName,
            event_description: event.eventDescription,
            event_date: event.eventDate,
            declared_hours: event.declaredHours,
            category_name: event.categoryName,
            created_by_name: event.createdByName,
            participant_count: event.participantCount,
            is_active: event.isActive,
            created_at: event.createdAt,
            participant_avatars: event.participantAvatars,
          }}
          onEdit={canManage ? () => onEdit(event) : undefined}
          onViewParticipants={() => onViewParticipants(event)}
          onRegister={() => onRegister(event.id)}
        />
      ))}
    </div>
  )
}
