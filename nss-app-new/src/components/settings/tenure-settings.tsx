'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Archive, CalendarRange, Loader2, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
import {
  getCurrentTenureInfo,
  startNewTenure,
} from '@/app/actions/admin/tenure'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

type TenureInfo = Awaited<ReturnType<typeof getCurrentTenureInfo>>

function suggestNextLabel(current: string | undefined) {
  if (!current) return ''
  const match = current.match(/^(\d{4})-(\d{4})$/)
  if (!match) return ''
  const end = Number(match[2])
  return `${end}-${end + 1}`
}

function defaultStartDate(nextLabel: string) {
  const match = nextLabel.match(/^(\d{4})-/)
  if (!match) return ''
  // NSS academic year typically starts in June
  return `${match[1]}-06-01`
}

export function TenureSettings() {
  const [info, setInfo] = useState<TenureInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCurrentTenureInfo()
      setInfo(data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load tenure info'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function handleOpen() {
    const nextLabel = suggestNextLabel(info?.current?.label)
    setLabel(nextLabel)
    setStartDate(defaultStartDate(nextLabel))
    setEndDate('')
    setOpen(true)
  }

  async function handleStart() {
    if (!/^\d{4}-\d{4}$/.test(label)) {
      toast.error('Label must be YYYY-YYYY (e.g. 2026-2027)')
      return
    }
    if (!startDate) {
      toast.error('Start date is required')
      return
    }
    setSubmitting(true)
    try {
      await startNewTenure({
        label,
        startDate,
        endDate: endDate || undefined,
      })
      toast.success(`Tenure ${label} started`)
      setOpen(false)
      await refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to start tenure'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4" />
          NSS Tenure
        </CardTitle>
        <CardDescription>
          Roll over to a new academic year. Previous data is preserved but hidden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Current Tenure</p>
            <p className="text-muted-foreground text-xs">
              {info?.current?.startDate
                ? `Started ${info.current.startDate}`
                : 'No tenure configured'}
            </p>
          </div>
          {loading ? (
            <Badge variant="outline">Loading...</Badge>
          ) : (
            <Badge variant="default">{info?.current?.label ?? 'None'}</Badge>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">Active 2nd years (SE)</div>
            <div className="text-2xl font-semibold tabular-nums">
              {info?.counts.activeSE ?? 0}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">Active 3rd years (TE)</div>
            <div className="text-2xl font-semibold tabular-nums">
              {info?.counts.activeTE ?? 0}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">Completed (alumni)</div>
            <div className="text-2xl font-semibold tabular-nums">
              {info?.counts.completedTotal ?? 0}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button onClick={handleOpen} disabled={loading} size="sm">
            <PlayCircle className="mr-1.5 h-4 w-4" />
            Start New Tenure
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/archive">
              <Archive className="mr-1.5 h-4 w-4" />
              View Archive
            </Link>
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start New Tenure</DialogTitle>
            <DialogDescription>
              This will promote and complete the current batch, then activate a new tenure
              for all future events and hours. Previous data is kept but hidden from
              default views.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {info && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <div className="mb-1 font-medium">This will affect:</div>
                <ul className="space-y-0.5 text-muted-foreground">
                  <li>
                    <span className="tabular-nums">{info.counts.activeTE}</span> TE students
                    → marked <span className="font-medium">completed</span>
                  </li>
                  <li>
                    <span className="tabular-nums">{info.counts.activeSE}</span> SE students
                    → promoted to <span className="font-medium">TE</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tenure-label">Label</Label>
                <Input
                  id="tenure-label"
                  placeholder="2026-2027"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">Format: YYYY-YYYY</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tenure-start">Start Date</Label>
                  <Input
                    id="tenure-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tenure-end">End Date (optional)</Label>
                  <Input
                    id="tenure-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleStart} disabled={submitting}>
              {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {submitting ? 'Starting...' : 'Start Tenure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
