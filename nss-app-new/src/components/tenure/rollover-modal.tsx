'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
import { getRolloverPreview, startNewTenure } from '@/app/actions/admin/tenure'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

type RolloverPreview = Awaited<ReturnType<typeof getRolloverPreview>>
type PreviewVolunteer = RolloverPreview['teActives'][number]

interface RolloverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLabel: string | null | undefined
  onSuccess?: () => void
}

function suggestNextLabel(current: string | null | undefined): string {
  if (!current) return ''
  const match = current.match(/^(\d{4})-(\d{4})$/)
  if (!match) return ''
  const end = Number(match[2])
  return `${end}-${end + 1}`
}

function defaultStartDate(nextLabel: string): string {
  const match = nextLabel.match(/^(\d{4})-/)
  if (!match) return ''
  return `${match[1]}-06-01`
}

export function RolloverModal({ open, onOpenChange, currentLabel, onSuccess }: RolloverModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [preview, setPreview] = useState<RolloverPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [graduateChecked, setGraduateChecked] = useState<Record<string, boolean>>({})
  const [promoteChecked, setPromoteChecked] = useState<Record<string, boolean>>({})
  const [teSearch, setTeSearch] = useState('')
  const [seSearch, setSeSearch] = useState('')

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true)
    try {
      const data = await getRolloverPreview()
      setPreview(data)
      setGraduateChecked(Object.fromEntries(data.teActives.map((v) => [v.id, true])))
      setPromoteChecked(Object.fromEntries(data.seActives.map((v) => [v.id, true])))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load rollover preview'))
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const nextLabel = suggestNextLabel(currentLabel)
    setLabel(nextLabel)
    setStartDate(defaultStartDate(nextLabel))
    setEndDate('')
    setTeSearch('')
    setSeSearch('')
    setPreview(null)
    loadPreview()
  }, [open, currentLabel, loadPreview])

  const filteredTE = useMemo(
    () => filterVolunteers(preview?.teActives ?? [], teSearch),
    [preview, teSearch]
  )
  const filteredSE = useMemo(
    () => filterVolunteers(preview?.seActives ?? [], seSearch),
    [preview, seSearch]
  )

  const graduateCount = countChecked(graduateChecked)
  const promoteCount = countChecked(promoteChecked)
  const stayCount =
    (preview?.teActives.length ?? 0) -
    graduateCount +
    ((preview?.seActives.length ?? 0) - promoteCount)

  async function handleStart() {
    if (!/^\d{4}-\d{4}$/.test(label)) {
      toast.error('Label must be YYYY-YYYY (e.g. 2026-2027)')
      return
    }
    if (!startDate) {
      toast.error('Start date is required')
      return
    }
    const excludeGraduates =
      preview?.teActives.filter((v) => !graduateChecked[v.id]).map((v) => v.id) ?? []
    const excludePromotions =
      preview?.seActives.filter((v) => !promoteChecked[v.id]).map((v) => v.id) ?? []

    setSubmitting(true)
    try {
      await startNewTenure({
        label,
        startDate,
        endDate: endDate || undefined,
        excludeGraduates,
        excludePromotions,
      })
      toast.success(`Tenure ${label} started`)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to start tenure'))
    } finally {
      setSubmitting(false)
    }
  }

  function setAllTE(checked: boolean) {
    if (!preview) return
    setGraduateChecked(Object.fromEntries(preview.teActives.map((v) => [v.id, checked])))
  }
  function setAllSE(checked: boolean) {
    if (!preview) return
    setPromoteChecked(Object.fromEntries(preview.seActives.map((v) => [v.id, checked])))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Start New Tenure</DialogTitle>
          <DialogDescription>
            Review who graduates and who promotes. Uncheck anyone staying in the same year
            (repeating a year). Previous data is preserved but hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-12rem)] space-y-4 overflow-y-auto pr-1">
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

          {previewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          ) : preview ? (
            <>
              <VolunteerReviewList
                title="TE → Completed (graduating)"
                emptyText="No active TE volunteers"
                volunteers={filteredTE}
                total={preview.teActives.length}
                checked={graduateChecked}
                onToggle={(id, v) => setGraduateChecked((prev) => ({ ...prev, [id]: v }))}
                onCheckAll={setAllTE}
                search={teSearch}
                onSearchChange={setTeSearch}
              />
              <VolunteerReviewList
                title="SE → TE (promoting)"
                emptyText="No active SE volunteers"
                volunteers={filteredSE}
                total={preview.seActives.length}
                checked={promoteChecked}
                onToggle={(id, v) => setPromoteChecked((prev) => ({ ...prev, [id]: v }))}
                onCheckAll={setAllSE}
                search={seSearch}
                onSearchChange={setSeSearch}
              />

              <div className="bg-muted/40 rounded-md border p-3 text-sm">
                <div className="font-medium">Summary</div>
                <p className="text-muted-foreground mt-1 text-xs">
                  <span className="tabular-nums">{graduateCount}</span> graduating ·
                  <span className="tabular-nums"> {promoteCount}</span> promoting to TE
                  {stayCount > 0 && (
                    <>
                      {' '}
                      · <span className="tabular-nums">{stayCount}</span> staying as-is
                    </>
                  )}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleStart} disabled={submitting || previewLoading}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {submitting ? 'Starting...' : 'Start Tenure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function filterVolunteers(list: PreviewVolunteer[], q: string): PreviewVolunteer[] {
  if (!q.trim()) return list
  const needle = q.toLowerCase()
  return list.filter(
    (v) =>
      v.firstName.toLowerCase().includes(needle) ||
      v.lastName.toLowerCase().includes(needle) ||
      v.rollNumber.toLowerCase().includes(needle) ||
      v.branch.toLowerCase().includes(needle)
  )
}

function countChecked(map: Record<string, boolean>): number {
  return Object.values(map).filter(Boolean).length
}

interface VolunteerReviewListProps {
  title: string
  emptyText: string
  volunteers: PreviewVolunteer[]
  total: number
  checked: Record<string, boolean>
  onToggle: (id: string, checked: boolean) => void
  onCheckAll: (checked: boolean) => void
  search: string
  onSearchChange: (value: string) => void
}

function VolunteerReviewList({
  title,
  emptyText,
  volunteers,
  total,
  checked,
  onToggle,
  onCheckAll,
  search,
  onSearchChange,
}: VolunteerReviewListProps) {
  const selected = volunteers.filter((v) => checked[v.id]).length

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="text-sm font-medium">
          {title}{' '}
          <span className="text-muted-foreground font-normal">
            ({selected}/{total})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onCheckAll(true)}>
            Select all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onCheckAll(false)}>
            None
          </Button>
        </div>
      </div>

      {total === 0 ? (
        <div className="text-muted-foreground px-3 py-6 text-center text-sm">{emptyText}</div>
      ) : (
        <>
          <div className="relative border-b px-3 py-2">
            <Search className="text-muted-foreground absolute top-1/2 left-5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              placeholder="Search by name, roll, or branch..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {volunteers.length === 0 ? (
              <div className="text-muted-foreground px-3 py-6 text-center text-xs">No matches</div>
            ) : (
              volunteers.map((v) => (
                <label
                  key={v.id}
                  className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0"
                >
                  <Checkbox
                    checked={!!checked[v.id]}
                    onCheckedChange={(val) => onToggle(v.id, !!val)}
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-medium">
                      {v.firstName} {v.lastName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {v.rollNumber} · {v.branch}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
