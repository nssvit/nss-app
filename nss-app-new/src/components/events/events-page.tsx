'use client'

import { useState, useMemo, useEffect } from 'react'
import { useEvents } from '@/hooks/use-events'
import { getEventParticipants } from '@/app/actions/events'
import { PageHeader } from '@/components/page-header'
import { EventFilters } from './event-filters'
import { EventFormModal } from './event-form-modal'
import { EventsGrid } from './events-grid'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  PARTICIPATION_STATUS_DISPLAY,
  PARTICIPATION_STATUS_COLORS,
  APPROVAL_STATUS_DISPLAY,
  APPROVAL_STATUS_COLORS,
} from '@/lib/constants'
import type { ParticipationStatus, ApprovalStatus } from '@/lib/constants'
import type { EventWithStats, EventCategory, EventParticipationWithVolunteer } from '@/types'

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
  const [selectedEvent, setSelectedEvent] = useState<EventWithStats | null>(null)
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [participants, setParticipants] = useState<EventParticipationWithVolunteer[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)

  useEffect(() => {
    if (!participantsOpen || !selectedEvent) return
    setParticipantsLoading(true)
    getEventParticipants(selectedEvent.id)
      .then(setParticipants)
      .catch((err) => console.error('Failed to load participants:', err))
      .finally(() => setParticipantsLoading(false))
  }, [participantsOpen, selectedEvent])

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
      <EventsGrid
        events={filteredEvents}
        onEventClick={(event) => {
          setSelectedEvent(event)
          setParticipants([])
          setParticipantsOpen(true)
        }}
      />

      <Dialog open={participantsOpen} onOpenChange={setParticipantsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.eventName} — Attendance
            </DialogTitle>
          </DialogHeader>
          {participantsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">Loading participants...</div>
            </div>
          ) : participants.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">No participants registered yet.</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Approval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.volunteerName ?? 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-none',
                          PARTICIPATION_STATUS_COLORS[
                            p.participationStatus as ParticipationStatus
                          ] ?? ''
                        )}
                      >
                        {PARTICIPATION_STATUS_DISPLAY[
                          p.participationStatus as ParticipationStatus
                        ] ?? p.participationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.hoursAttended}h</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-none',
                          APPROVAL_STATUS_COLORS[p.approvalStatus as ApprovalStatus] ?? ''
                        )}
                      >
                        {APPROVAL_STATUS_DISPLAY[p.approvalStatus as ApprovalStatus] ??
                          p.approvalStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
