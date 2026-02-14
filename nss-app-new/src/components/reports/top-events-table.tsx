'use client'

import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { EventWithStats } from '@/types'

interface TopEventsTableProps {
  events: EventWithStats[]
  loading?: boolean
}

export function TopEventsTable({ events, loading }: TopEventsTableProps) {
  const topEvents = useMemo(
    () =>
      [...events].sort((a, b) => (b.participantCount ?? 0) - (a.participantCount ?? 0)).slice(0, 5),
    [events]
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Events</CardTitle>
        <CardDescription>Events ranked by participant count</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Participants</TableHead>
              <TableHead className="text-right">Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.eventName}</TableCell>
                <TableCell>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}</TableCell>
                <TableCell>{event.categoryName ?? 'N/A'}</TableCell>
                <TableCell className="text-right">{event.participantCount ?? 0}</TableCell>
                <TableCell className="text-right">{event.totalHours ?? 0}</TableCell>
              </TableRow>
            ))}
            {topEvents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  No events found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
