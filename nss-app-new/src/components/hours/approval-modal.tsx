'use client'

import type { EventParticipationWithVolunteer } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ApprovalModalProps {
  participation: EventParticipationWithVolunteer | null
  action: 'approve' | 'reject'
  onConfirm: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApprovalModal({
  participation,
  action,
  onConfirm,
  open,
  onOpenChange,
}: ApprovalModalProps) {
  if (!participation) return null

  const volunteerName =
    participation.volunteerName ??
    (participation.volunteer
      ? `${participation.volunteer.firstName} ${participation.volunteer.lastName}`
      : participation.volunteerId)

  const isApprove = action === 'approve'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isApprove ? 'Approve Hours' : 'Reject Hours'}</AlertDialogTitle>
          <AlertDialogDescription>
            {isApprove
              ? `Are you sure you want to approve ${participation.hoursAttended} hours for ${volunteerName}?`
              : `Are you sure you want to reject the hours submission for ${volunteerName}? This action can be reversed later.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={isApprove ? 'default' : 'destructive'} onClick={onConfirm}>
            {isApprove ? 'Approve' : 'Reject'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
