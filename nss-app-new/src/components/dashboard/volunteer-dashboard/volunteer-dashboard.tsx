'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/error-utils'
import { getMyHoursSummary } from '@/app/actions/volunteers'
import { NSS_HOURS_REQUIRED } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function VolunteerDashboard() {
  const [approved, setApproved] = useState<number | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const data = await getMyHoursSummary()
        if (!ignore) setApproved(data.approvedHours)
      } catch (err) {
        if (!ignore) toast.error(getErrorMessage(err, 'Failed to load hours'))
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  if (approved === null) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    )
  }

  const required = NSS_HOURS_REQUIRED
  const percent = Math.min(100, Math.round((approved / required) * 100))
  const remaining = Math.max(0, required - approved)
  const done = approved >= required

  return (
    <Card>
      <CardContent className="space-y-6 p-8">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
              Approved Hours
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tabular-nums">{approved}</span>
              <span className="text-muted-foreground text-xl">/ {required}</span>
            </div>
          </div>
          {done && (
            <div className="flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </div>
          )}
        </div>

        <div>
          <div className="bg-muted/50 h-3 overflow-hidden rounded-full">
            <div
              className={
                done
                  ? 'h-full rounded-full bg-green-500 transition-all'
                  : 'h-full rounded-full bg-primary transition-all'
              }
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="text-muted-foreground mt-2 text-sm">
            {done
              ? 'You have met this tenure\u2019s hours requirement.'
              : `${remaining} hours remaining to meet this tenure\u2019s requirement.`}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
