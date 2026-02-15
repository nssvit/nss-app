import { CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  APPROVAL_STATUS_COLORS,
  APPROVAL_STATUS_DISPLAY,
  type ApprovalStatus,
} from '@/lib/constants'
import type { EventParticipationWithVolunteer } from '@/types'

interface HoursCardProps {
  participation: EventParticipationWithVolunteer
  onApprove: () => void
  onReject: () => void
}

export function HoursCard({ participation: p, onApprove, onReject }: HoursCardProps) {
  const volunteerName = p.volunteer
    ? `${p.volunteer.firstName} ${p.volunteer.lastName}`
    : p.volunteerId

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{volunteerName}</p>
            <p className="text-muted-foreground truncate text-xs">
              {p.eventId}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn('shrink-0', APPROVAL_STATUS_COLORS[p.approvalStatus as ApprovalStatus])}
          >
            {APPROVAL_STATUS_DISPLAY[p.approvalStatus as ApprovalStatus] ?? p.approvalStatus}
          </Badge>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold">{p.hoursAttended}</span>
            <span className="text-muted-foreground ml-1 text-sm">hrs</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-green-500 hover:text-green-600"
              onClick={onApprove}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-500 hover:text-red-600"
              onClick={onReject}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
