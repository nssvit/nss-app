'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  PARTICIPATION_STATUS_DISPLAY,
  PARTICIPATION_STATUS_COLORS,
  APPROVAL_STATUS_DISPLAY,
  APPROVAL_STATUS_COLORS,
} from '@/lib/constants'
import type { ParticipationStatus, ApprovalStatus } from '@/lib/constants'
import type { EventParticipationWithVolunteer } from '@/types'
import { getEventParticipants } from '@/app/actions/events'
import { cn } from '@/lib/utils'

interface EventParticipantsProps {
  eventId: string
  eventName: string
}

export function EventParticipants({ eventId, eventName }: EventParticipantsProps) {
  const [participants, setParticipants] = useState<EventParticipationWithVolunteer[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getEventParticipants(eventId)
      .then((data) => {
        setParticipants(data)
      })
      .catch((err) => {
        console.error('Failed to load participants:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open, eventId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4" />
          Participants
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Participants - {eventName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">Loading participants...</div>
          </div>
        ) : participants.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">No participants registered yet.</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volunteer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Approval</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.volunteerName ?? 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'border-none',
                        PARTICIPATION_STATUS_COLORS[p.participationStatus as ParticipationStatus] ??
                          ''
                      )}
                    >
                      {PARTICIPATION_STATUS_DISPLAY[p.participationStatus as ParticipationStatus] ??
                        p.participationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.hoursAttended}h</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'border-none',
                        APPROVAL_STATUS_COLORS[p.approvalStatus as ApprovalStatus] ?? ''
                      )}
                    >
                      {APPROVAL_STATUS_DISPLAY[p.approvalStatus as ApprovalStatus] ??
                        p.approvalStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
