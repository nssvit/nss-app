'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approval</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participations.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.eventName ?? p.event?.eventName ?? 'Unknown'}
                </TableCell>
                <TableCell>{p.event?.eventDate ?? 'N/A'}</TableCell>
                <TableCell className="text-right">{p.hoursAttended}</TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      PARTICIPATION_STATUS_COLORS[p.participationStatus as ParticipationStatus]
                    )}
                  >
                    {PARTICIPATION_STATUS_DISPLAY[p.participationStatus as ParticipationStatus] ??
                      p.participationStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(APPROVAL_STATUS_COLORS[p.approvalStatus as ApprovalStatus])}>
                    {APPROVAL_STATUS_DISPLAY[p.approvalStatus as ApprovalStatus] ??
                      p.approvalStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {participations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  No participation history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
