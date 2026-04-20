'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { VolunteerWithStats } from '@/types'
import { getErrorMessage } from '@/lib/error-utils'
import {
  getVolunteerReferences,
  permanentlyDeleteVolunteer,
} from '@/app/actions/volunteers'
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
import { Button } from '@/components/ui/button'

interface PermanentDeleteModalProps {
  volunteer: VolunteerWithStats | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type References = Awaited<ReturnType<typeof getVolunteerReferences>>

export function PermanentDeleteModal({
  volunteer,
  open,
  onOpenChange,
  onSuccess,
}: PermanentDeleteModalProps) {
  const [refs, setRefs] = useState<References | null>(null)
  const [typed, setTyped] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !volunteer) {
      setRefs(null)
      setTyped('')
      setAcknowledged(false)
      return
    }
    let ignore = false
    ;(async () => {
      try {
        setLoadingRefs(true)
        const data = await getVolunteerReferences(volunteer.id)
        if (!ignore) setRefs(data)
      } catch (err) {
        if (!ignore) toast.error(getErrorMessage(err, 'Failed to load user references'))
      } finally {
        if (!ignore) setLoadingRefs(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [open, volunteer])

  if (!volunteer) return null

  const expectedName = `${volunteer.firstName} ${volunteer.lastName}`
  const nameMatches = typed.trim().toLowerCase() === expectedName.trim().toLowerCase()
  const refsRequireAck = (refs?.hasAnyReferences ?? false) && refs?.canPermanentlyDelete === true
  const canSubmit =
    !!refs &&
    refs.canPermanentlyDelete &&
    nameMatches &&
    (!refsRequireAck || acknowledged) &&
    !submitting

  async function handleDelete() {
    if (!volunteer) return
    setSubmitting(true)
    try {
      await permanentlyDeleteVolunteer(volunteer.id, typed)
      toast.success(`${expectedName} permanently deleted`)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete user'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Permanent Delete
          </DialogTitle>
          <DialogDescription>
            This will permanently remove {expectedName} and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {loadingRefs ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            Loading records...
          </div>
        ) : refs ? (
          <div className="space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
              <div className="mb-2 font-medium">Records for this user:</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  <span className="tabular-nums">{refs.participations}</span> event
                  participations
                </li>
                <li>
                  <span className="tabular-nums">{refs.eventsCreated}</span> events created
                </li>
                <li>
                  <span className="tabular-nums">{refs.roles}</span> role assignments
                </li>
                <li>
                  <span className="tabular-nums">{refs.auditEntries}</span> audit entries
                </li>
              </ul>
            </div>

            {!refs.canPermanentlyDelete ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {refs.blockReason ??
                  'Cannot permanently delete this user. Keep them deactivated.'}
              </div>
            ) : (
              <>
                {refsRequireAck && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-500">
                    Deleting will also remove their participations, role history, and
                    anonymize their audit log entries. Event stats for past events will
                    shrink.
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="confirm-name">
                    Type <span className="font-mono">{expectedName}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-name"
                    autoComplete="off"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={expectedName}
                  />
                </div>

                {refsRequireAck && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-destructive"
                    />
                    <span>I understand this will delete all of the records above.</span>
                  </label>
                )}
              </>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!canSubmit}
          >
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {submitting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
