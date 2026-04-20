'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Archive, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
import {
  getTenureArchive,
  getTenureEvents,
} from '@/app/actions/admin/tenure'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Tenure = Awaited<ReturnType<typeof getTenureArchive>>[number]
type TenureEvent = Awaited<ReturnType<typeof getTenureEvents>>[number]

export function TenureArchivePage() {
  const [tenures, setTenures] = useState<Tenure[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Tenure | null>(null)
  const [events, setEvents] = useState<TenureEvent[] | null>(null)
  const [eventsLoading, setEventsLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTenureArchive()
      setTenures(data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load archive'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openTenure = useCallback(async (tenure: Tenure) => {
    setSelected(tenure)
    setEvents(null)
    setEventsLoading(true)
    try {
      const data = await getTenureEvents(tenure.id)
      setEvents(data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load events'))
    } finally {
      setEventsLoading(false)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/settings">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
        <PageHeader
          title="Tenure Archive"
          description="Browse past NSS tenures. Read-only."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Archive className="h-4 w-4" />
            All Tenures
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !tenures || tenures.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="No tenures yet"
              description="Create a tenure from the Settings page to begin tracking data by academic year."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Volunteers</TableHead>
                    <TableHead className="text-right">Approved Hrs</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenures.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.label}
                        {t.isCurrent && (
                          <Badge variant="default" className="ml-2">
                            Current
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.startDate}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.endDate ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t.eventCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t.volunteerCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t.totalHours}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openTenure(t)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tenure {selected?.label}</DialogTitle>
            <DialogDescription>
              {selected?.startDate} to {selected?.endDate ?? '—'} · Read-only snapshot of
              events.
            </DialogDescription>
          </DialogHeader>

          {eventsLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              Loading events...
            </div>
          ) : !events || events.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No events were recorded in this tenure.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                    <TableHead className="text-right">Hrs</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.eventName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.categoryName ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(e.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {e.participantCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{e.totalHours}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {e.eventStatus.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
