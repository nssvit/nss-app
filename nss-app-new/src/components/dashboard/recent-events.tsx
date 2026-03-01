'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { EVENT_STATUS_COLORS, EVENT_STATUS_DISPLAY } from '@/lib/constants'
import type { EventStatus } from '@/lib/constants'
import type { EventWithStats } from '@/types'
import { getEvents } from '@/app/actions/events'

function RecentEventsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  )
}

export function RecentEvents() {
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getEvents()
        const sorted = [...data].sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
          return dateB - dateA
        })
        setEvents(sorted.slice(0, 5))
      } catch (err) {
        console.error('Failed to load recent events:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <RecentEventsSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>Latest NSS activities and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => {
            const statusColors = EVENT_STATUS_COLORS[event.eventStatus as EventStatus] ?? ''
            const statusLabel =
              EVENT_STATUS_DISPLAY[event.eventStatus as EventStatus] ?? event.eventStatus

            return (
              <div
                key={event.id}
                className="flex flex-col gap-2 border-b border-border/50 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium">{event.eventName}</p>
                  <div className="text-muted-foreground flex items-center gap-3 text-xs">
                    {event.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{event.location}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    {event.participantCount ?? 0}
                  </span>
                  <Badge variant="secondary" className={cn('text-[10px]', statusColors)}>
                    {statusLabel}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
