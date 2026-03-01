import { memo } from 'react'
import { Calendar, MapPin, Users, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventStatusBadge } from './event-status-badge'
import { cn } from '@/lib/utils'
import type { EventWithStats } from '@/types'

interface EventCardProps {
  event: EventWithStats
  onClick?: () => void
}

export const EventCard = memo(function EventCard({ event, onClick }: EventCardProps) {
  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'TBD'

  const attended = event.userParticipationStatus === 'present' || event.userParticipationStatus === 'partially_present'

  return (
    <Card
      className={cn('transition-colors hover:bg-accent/50', onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {attended && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />}
            <CardTitle className="line-clamp-1 text-base">{event.eventName}</CardTitle>
          </div>
          <EventStatusBadge status={event.eventStatus} />
        </div>
        {event.categoryName && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: event.categoryColor ?? '#6b7280' }}
            />
            {event.categoryName}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Calendar className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <span>{formattedDate}</span>
        </div>
        {event.location && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Users className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span>{event.participantCount ?? 0} participants</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span>{event.declaredHours}h credits</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
