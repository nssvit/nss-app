'use client'

import { useCallback, useState } from 'react'
import { Archive, Download, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
import { exportTenureCSV, getTenureArchive, getTenureEvents } from '@/app/actions/admin/tenure'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ArchiveRow = Awaited<ReturnType<typeof getTenureArchive>>[number]
type TenureEvent = Awaited<ReturnType<typeof getTenureEvents>>[number]

interface TenureArchiveTabProps {
  archive: ArchiveRow[] | null
  loading: boolean
}

function triggerCSVDownload(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function TenureArchiveTab({ archive, loading }: TenureArchiveTabProps) {
  const [selected, setSelected] = useState<ArchiveRow | null>(null)
  const [events, setEvents] = useState<TenureEvent[] | null>(null)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const openTenure = useCallback(async (tenure: ArchiveRow) => {
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

  async function handleDownload(tenure: ArchiveRow) {
    setDownloadingId(tenure.id)
    try {
      const { filename, csv } = await exportTenureCSV(tenure.id)
      triggerCSVDownload(filename, csv)
      toast.success(`Downloaded ${filename}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to export CSV'))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Archive className="h-4 w-4" />
            All Tenures
          </CardTitle>
          <CardDescription>
            Every academic year with aggregate stats. Click a row to view events, or download the
            CSV for that tenure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !archive || archive.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No tenures yet. Start one from the Overview tab.
            </p>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archive.map((t) => (
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
                      <TableCell className="text-muted-foreground">{t.endDate ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.eventCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.volunteerCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.totalHours}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openTenure(t)}
                            title="View events"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(t)}
                            disabled={downloadingId === t.id}
                            title="Download CSV"
                          >
                            {downloadingId === t.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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
              {selected?.startDate} to {selected?.endDate ?? '—'} · Read-only snapshot of events.
            </DialogDescription>
          </DialogHeader>

          {eventsLoading ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              Loading events...
            </div>
          ) : !events || events.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
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
    </>
  )
}
