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
import { getVolunteerDashboardData } from '@/app/actions/volunteers'

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
  const [stats, setStats] = useState<{
    totalHours: number
    approvedHours: number
    eventsParticipated: number
  } | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action returns untyped events
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getVolunteerDashboardData()
        setStats(data.stats)
        setUpcomingEvents(data.availableEvents || [])
      } catch (err) {
        console.error('Failed to load volunteer dashboard:', err)
      } finally {
        setLoading(false)
      }
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
          value={stats?.eventsParticipated ?? 0}
          icon={Calendar}
        />
        <StatsCard title="Hours Logged" value={stats?.totalHours ?? 0} icon={Clock} />
        <StatsCard title="Approved Hours" value={stats?.approvedHours ?? 0} icon={CheckCircle} />
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
                const eventStatus = event.eventStatus || event.event_status || ''
                const statusColors = EVENT_STATUS_COLORS[eventStatus as EventStatus] ?? ''
                const statusLabel = EVENT_STATUS_DISPLAY[eventStatus as EventStatus] ?? eventStatus
                const eventDate = event.startDate || event.start_date
                const eventName = event.eventName || event.event_name
                const declaredHours = event.declaredHours || event.declared_hours || 0

                return (
                  <div
                    key={event.id}
                    className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium">{eventName}</p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <CalendarDays className="h-3 w-3" />
                        {eventDate
                          ? new Date(eventDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'TBD'}
                        <span className="text-muted-foreground/50">|</span>
                        {declaredHours}h credits
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
