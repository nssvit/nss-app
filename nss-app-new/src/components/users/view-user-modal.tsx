'use client'

import type { VolunteerWithStats } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { BRANCH_DISPLAY_NAMES, YEAR_DISPLAY_NAMES } from '@/lib/constants'

interface ViewUserModalProps {
  volunteer: VolunteerWithStats | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value ?? '---'}</span>
    </div>
  )
}

export function ViewUserModal({ volunteer, open, onOpenChange }: ViewUserModalProps) {
  if (!volunteer) return null

  const initials = `${volunteer.firstName[0]}${volunteer.lastName[0]}`.toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Volunteer Details</DialogTitle>
          <DialogDescription>
            Viewing profile for {volunteer.firstName} {volunteer.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <Avatar size="lg">
            {volunteer.profilePic && <AvatarImage src={volunteer.profilePic} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">
              {volunteer.firstName} {volunteer.lastName}
            </p>
            <p className="text-muted-foreground text-sm">{volunteer.email}</p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'ml-auto',
              volunteer.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}
          >
            {volunteer.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-2">
          <DetailRow label="Roll Number" value={volunteer.rollNumber} />
          <DetailRow label="Branch" value={BRANCH_DISPLAY_NAMES[volunteer.branch] ?? volunteer.branch} />
          <DetailRow label="Year" value={YEAR_DISPLAY_NAMES[volunteer.year] ?? volunteer.year} />
          <DetailRow label="Phone" value={volunteer.phoneNo} />
          <DetailRow label="Gender" value={volunteer.gender} />
          <DetailRow label="Address" value={volunteer.address} />
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Participation Stats</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold">{volunteer.eventsParticipated ?? 0}</p>
              <p className="text-muted-foreground text-xs">Events</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold">{volunteer.totalHours ?? 0}</p>
              <p className="text-muted-foreground text-xs">Total Hours</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold">{volunteer.approvedHours ?? 0}</p>
              <p className="text-muted-foreground text-xs">Approved Hours</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
