'use client'

import { useState } from 'react'
import { CalendarDays, Search, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EVENT_STATUS_COLORS, EVENT_STATUS_DISPLAY, type EventStatus } from '@/lib/constants'
import { useAttendance } from '@/hooks/use-attendance'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AttendancePage() {
  const { events, loading } = useAttendance()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      searchQuery === '' ||
      e.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location ?? '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || e.eventStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="View attendance records across all events." />

      <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center')}>
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by event name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="registration_closed">Registration Closed</SelectItem>
            <SelectItem value="registration_open">Registration Open</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted rounded-full p-4">
            <CalendarDays className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No events found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            No events match your current filters. Try adjusting your search or filter.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Credits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.eventName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{event.location ?? 'N/A'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(EVENT_STATUS_COLORS[event.eventStatus as EventStatus])}
                    >
                      {EVENT_STATUS_DISPLAY[event.eventStatus as EventStatus] ?? event.eventStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.categoryName ? (
                      <Badge
                        variant="outline"
                        style={
                          event.categoryColor
                            ? {
                                borderColor: event.categoryColor,
                                color: event.categoryColor,
                              }
                            : undefined
                        }
                      >
                        {event.categoryName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">{event.participantCount ?? 0}</span>
                      {event.maxParticipants && (
                        <span className="text-muted-foreground text-xs">
                          /{event.maxParticipants}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{event.totalHours ?? 0}</span>
                    <span className="text-muted-foreground ml-1 text-xs">hrs</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{event.declaredHours}</span>
                    <span className="text-muted-foreground ml-1 text-xs">hrs</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
