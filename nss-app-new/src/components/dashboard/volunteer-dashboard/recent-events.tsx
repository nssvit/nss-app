'use client'

import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  EVENT_STATUS_COLORS,
  EVENT_STATUS_DISPLAY,
  APPROVAL_STATUS_COLORS,
  APPROVAL_STATUS_DISPLAY,
} from '@/lib/constants'
import type { EventStatus, ApprovalStatus } from '@/lib/constants'
import type { EventParticipationWithEvent } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  'Area Based - 1': '#22C55E',
  'Area Based - 2': '#16A34A',
  'University Based': '#8B5CF6',
  'College Based': '#CA8A04',
}

interface RecentEventsProps {
  participation: EventParticipationWithEvent[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action returns untyped events
  upcomingEvents: any[]
}

export function RecentEvents({ participation, upcomingEvents }: RecentEventsProps) {
  return (
    <>
      {/* Recent Event History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Your latest event participation</CardDescription>
        </CardHeader>
        <CardContent>
          {participation.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No events participated yet.
            </p>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto">
              {participation.slice(0, 8).map((p) => {
                const date = p.startDate
                  ? new Date(p.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''

                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[p.categoryName ?? ''] ?? '#6b7280',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.eventName}</p>
                      <p className="text-muted-foreground text-xs">
                        {date}
                        {p.categoryName ? ` · ${p.categoryName}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {p.approvalStatus === 'approved' ? (p.approvedHours ?? 0) : (p.hoursAttended ?? 0)}h
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-none text-[10px]',
                          APPROVAL_STATUS_COLORS[p.approvalStatus as ApprovalStatus] ?? ''
                        )}
                      >
                        {APPROVAL_STATUS_DISPLAY[p.approvalStatus as ApprovalStatus] ??
                          p.approvalStatus}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
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
    </>
  )
}
