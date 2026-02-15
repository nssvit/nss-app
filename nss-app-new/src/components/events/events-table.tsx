import { Calendar, MapPin, Users, Clock, CheckCircle } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { EventStatusBadge } from './event-status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EventWithStats } from '@/types'

interface EventsTableProps {
  events: EventWithStats[]
  onEventClick?: (event: EventWithStats) => void
}

export function EventsTable({ events, onEventClick }: EventsTableProps) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>My Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const formattedDate = event.startDate
              ? new Date(event.startDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'TBD'

            return (
              <TableRow
                key={event.id}
                className={onEventClick ? 'cursor-pointer' : undefined}
                onClick={onEventClick ? () => onEventClick(event) : undefined}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{event.eventName}</p>
                    {event.categoryName && (
                      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: event.categoryColor ?? '#6b7280' }}
                        />
                        {event.categoryName}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {formattedDate}
                  </div>
                </TableCell>
                <TableCell>
                  {event.location ? (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    {event.participantCount ?? 0}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {event.declaredHours}h
                  </div>
                </TableCell>
                <TableCell>
                  <EventStatusBadge status={event.eventStatus} />
                </TableCell>
                <TableCell>
                  {event.userParticipationStatus === 'present' || event.userParticipationStatus === 'partially_present' ? (
                    <div className="flex items-center gap-1.5 text-sm text-green-500">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Attended
                    </div>
                  ) : event.userParticipationStatus === 'registered' ? (
                    <span className="text-muted-foreground text-sm">Registered</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
