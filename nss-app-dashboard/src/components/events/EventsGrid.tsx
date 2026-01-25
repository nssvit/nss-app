'use client'

/**
 * EventsGrid Component
 * Grid display of event cards
 */

import { Skeleton, EmptyState } from '@/components/ui'
import { EventCard } from './EventCard'
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

export function EventsGrid({
  events,
  loading,
  isMobile,
  canManage,
  onEdit,
  onViewParticipants,
  onRegister,
}: EventsGridProps) {
  if (loading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No events found"
        description="Try adjusting your filters or create a new event"
        icon="fas fa-calendar-times"
      />
    )
  }

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          title={event.eventName || 'Untitled Event'}
          date={event.eventDate || 'TBD'}
          description={event.eventDescription || ''}
          category={event.categoryName || 'General'}
          hours={String(event.declaredHours || 0)}
          participants={(event.participantAvatars || []).map((p: any) => ({
            avatar: p.avatar || p.profile_pic || '',
            alt: p.name || p.alt || 'Participant',
          }))}
          participantCount={event.participantCount || 0}
          onEdit={canManage ? () => onEdit(event) : undefined}
          onViewParticipants={() => onViewParticipants(event)}
          createdBy={event.createdByName}
          canEdit={canManage}
        />
      ))}
    </div>
  )
}
