'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import { cn } from '@/lib/utils'
import { EVENT_STATUS_COLORS, EVENT_STATUS_DISPLAY } from '@/lib/constants'
import type { EventStatus } from '@/lib/constants'
import type { VolunteerWithStats, EventWithStats } from '@/types'
import { getVolunteers, getEvents } from '@/lib/mock-api'

function VolunteerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  )
}

export function VolunteerDashboard() {
  const [volunteer, setVolunteer] = useState<VolunteerWithStats | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [volunteers, events] = await Promise.all([getVolunteers(), getEvents()])
      // Use the first volunteer as the current user for demo
      setVolunteer(volunteers[0] ?? null)
      const upcoming = events
        .filter((e) => ['upcoming', 'registration_open', 'planned'].includes(e.eventStatus))
        .sort((a, b) => {
          const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0
          const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0
          return dateA - dateB
        })
      setUpcomingEvents(upcoming)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <VolunteerDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Events Participated"
          value={volunteer?.eventsParticipated ?? 0}
          icon={Calendar}
        />
        <StatsCard title="Hours Logged" value={volunteer?.totalHours ?? 0} icon={Clock} />
        <StatsCard
          title="Approved Hours"
          value={volunteer?.approvedHours ?? 0}
          icon={CheckCircle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events you can register for or attend</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No upcoming events at the moment.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const statusColors = EVENT_STATUS_COLORS[event.eventStatus as EventStatus] ?? ''
                const statusLabel =
                  EVENT_STATUS_DISPLAY[event.eventStatus as EventStatus] ?? event.eventStatus

                return (
                  <div
                    key={event.id}
                    className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium">{event.eventName}</p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <CalendarDays className="h-3 w-3" />
                        {event.eventDate
                          ? new Date(event.eventDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'TBD'}
                        <span className="text-muted-foreground/50">|</span>
                        {event.hoursCredits}h credits
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn('text-[10px]', statusColors)}>
                      {statusLabel}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
