import { Calendar, MapPin, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventStatusBadge } from './event-status-badge'
import type { EventWithStats } from '@/types'

interface EventCardProps {
  event: EventWithStats
}

export function EventCard({ event }: EventCardProps) {
  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'TBD'

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">{event.eventName}</CardTitle>
          <EventStatusBadge status={event.eventStatus} />
        </div>
        {event.categoryName && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: event.categoryColor ?? '#6b7280' }}
            />
            {event.categoryName}
          </div>
        )}
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{formattedDate}</span>
        </div>
        {event.location && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 shrink-0" />
            <span>{event.participantCount ?? 0} participants</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{event.hoursCredits}h credits</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
