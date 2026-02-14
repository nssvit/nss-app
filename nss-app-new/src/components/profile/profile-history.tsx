'use client'

import { Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  PARTICIPATION_STATUS_DISPLAY,
  PARTICIPATION_STATUS_COLORS,
  APPROVAL_STATUS_DISPLAY,
  APPROVAL_STATUS_COLORS,
  type ParticipationStatus,
  type ApprovalStatus,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { EventParticipationWithEvent } from '@/types'

interface ProfileHistoryProps {
  participations: EventParticipationWithEvent[]
}

export function ProfileHistory({ participations }: ProfileHistoryProps) {
  if (participations.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          No participation history found.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {participations.map((p) => (
        <Card key={p.id}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-primary/10 shrink-0 rounded-lg p-2.5">
              <Calendar className="text-primary h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {p.eventName ?? p.event?.eventName ?? 'Unknown'}
              </p>
              <p className="text-muted-foreground text-xs">
                {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}
                {p.categoryName && ` \u00B7 ${p.categoryName}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-medium">{p.hoursAttended}h</span>
              <Badge
                className={cn(
                  PARTICIPATION_STATUS_COLORS[p.participationStatus as ParticipationStatus]
                )}
              >
                {PARTICIPATION_STATUS_DISPLAY[p.participationStatus as ParticipationStatus] ??
                  p.participationStatus}
              </Badge>
              <Badge
                className={cn(APPROVAL_STATUS_COLORS[p.approvalStatus as ApprovalStatus])}
              >
                {APPROVAL_STATUS_DISPLAY[p.approvalStatus as ApprovalStatus] ??
                  p.approvalStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
