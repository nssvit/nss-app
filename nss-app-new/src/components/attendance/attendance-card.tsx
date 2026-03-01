import { memo } from 'react'
import { Calendar, MapPin, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { EVENT_STATUS_COLORS, EVENT_STATUS_DISPLAY, type EventStatus } from '@/lib/constants'

interface AttendanceEvent {
  id: string
  eventName: string
  startDate?: Date | string
  location?: string | null
  eventStatus: string
  categoryName?: string | null
  categoryColor?: string | null
  participantCount?: number
  maxParticipants?: number | null
  totalHours?: number
  declaredHours: number
}

interface AttendanceCardProps {
  event: AttendanceEvent
}

export const AttendanceCard = memo(function AttendanceCard({ event }: AttendanceCardProps) {
  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'TBD'

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">{event.eventName}</CardTitle>
          <Badge
            variant="outline"
            className={cn('shrink-0', EVENT_STATUS_COLORS[event.eventStatus as EventStatus])}
          >
            {EVENT_STATUS_DISPLAY[event.eventStatus as EventStatus] ?? event.eventStatus}
          </Badge>
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
      <CardContent className="grid gap-2">
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
            <span>
              {event.participantCount ?? 0}
              {event.maxParticipants ? `/${event.maxParticipants}` : ''}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{event.declaredHours}h credits</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
