'use client'

import { CheckCircle, XCircle, Clock } from 'lucide-react'
import type { EventParticipationWithVolunteer } from '@/types'
import { cn } from '@/lib/utils'
import {
  APPROVAL_STATUS_COLORS,
  APPROVAL_STATUS_DISPLAY,
  PARTICIPATION_STATUS_COLORS,
  PARTICIPATION_STATUS_DISPLAY,
  type ApprovalStatus,
  type ParticipationStatus,
} from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface HoursTableProps {
  participations: EventParticipationWithVolunteer[]
  loading: boolean
  onApprove: (participation: EventParticipationWithVolunteer) => void
  onReject: (participation: EventParticipationWithVolunteer) => void
}

export function HoursTable({ participations, loading, onApprove, onReject }: HoursTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (participations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted rounded-full p-4">
          <Clock className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No pending approvals</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          All volunteer hours have been reviewed. Check back later for new submissions.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Volunteer</TableHead>
            <TableHead>Event ID</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Participation</TableHead>
            <TableHead>Approval Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participations.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">
                {(p.volunteerName ?? p.volunteer)
                  ? `${p.volunteer?.firstName ?? ''} ${p.volunteer?.lastName ?? ''}`
                  : p.volunteerId}
              </TableCell>
              <TableCell className="text-muted-foreground">{p.eventId}</TableCell>
              <TableCell>
                <span className="font-semibold">{p.hoursAttended}</span>
                <span className="text-muted-foreground ml-1 text-xs">hrs</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    PARTICIPATION_STATUS_COLORS[p.participationStatus as ParticipationStatus]
                  )}
                >
                  {PARTICIPATION_STATUS_DISPLAY[p.participationStatus as ParticipationStatus] ??
                    p.participationStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(APPROVAL_STATUS_COLORS[p.approvalStatus as ApprovalStatus])}
                >
                  {APPROVAL_STATUS_DISPLAY[p.approvalStatus as ApprovalStatus] ?? p.approvalStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(p.registeredAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-500 hover:text-green-600"
                    onClick={() => onApprove(p)}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => onReject(p)}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
