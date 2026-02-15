'use client'

import { useState, useEffect } from 'react'
import type { VolunteerWithStats, EventParticipationWithEvent } from '@/types'
import { getVolunteerParticipationHistory } from '@/app/actions/volunteers'
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
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  BRANCH_DISPLAY_NAMES,
  YEAR_DISPLAY_NAMES,
  ROLE_COLORS,
  ROLE_DISPLAY_NAMES,
  APPROVAL_STATUS_DISPLAY,
  APPROVAL_STATUS_COLORS,
  type Role,
  type ApprovalStatus,
} from '@/lib/constants'

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

// Category colors matching the DB categories
const CATEGORY_COLORS: Record<string, string> = {
  'Area Based - 1': '#22C55E',
  'Area Based - 2': '#16A34A',
  'University Based': '#8B5CF6',
  'College Based': '#CA8A04',
}

export function ViewUserModal({ volunteer, open, onOpenChange }: ViewUserModalProps) {
  const [participation, setParticipation] = useState<EventParticipationWithEvent[]>([])
  const [loading, setLoading] = useState(false)
  const volunteerId = volunteer?.id

  useEffect(() => {
    if (!open || !volunteerId) return
    setLoading(true)
    getVolunteerParticipationHistory(volunteerId)
      .then(setParticipation)
      .catch((err) => console.error('Failed to load participation:', err))
      .finally(() => setLoading(false))
  }, [open, volunteerId])

  if (!volunteer) return null

  const initials = `${volunteer.firstName[0]}${volunteer.lastName[0]}`.toUpperCase()

  // Compute hours by category (skip rejected participations)
  const hoursByCategory = participation.reduce(
    (acc, p) => {
      if (p.approvalStatus === 'rejected') return acc
      const cat = p.categoryName || 'Other'
      const hours = p.approvalStatus === 'approved'
        ? (p.approvedHours ?? 0)
        : (p.hoursAttended ?? 0)
      acc[cat] = (acc[cat] || 0) + hours
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
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
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">
                {volunteer.firstName} {volunteer.lastName}
              </p>
              {volunteer.roleName && volunteer.roleName !== 'volunteer' && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'border-none text-xs',
                    ROLE_COLORS[volunteer.roleName as Role]
                  )}
                >
                  {ROLE_DISPLAY_NAMES[volunteer.roleName as Role] ?? volunteer.roleName}
                </Badge>
              )}
            </div>
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

        <Separator />

        {/* Hours by Category */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Hours by Category</h4>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : Object.keys(hoursByCategory).length === 0 ? (
            <p className="text-muted-foreground text-sm">No participation data yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(hoursByCategory).map(([cat, hours]) => (
                <div key={cat} className="flex items-center gap-3 rounded-md border p-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] ?? '#6b7280' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{cat}</p>
                    <p className="text-muted-foreground text-xs">{hours}h completed</p>
                  </div>
                  <p className="text-lg font-bold">{hours}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Event History */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Event History</h4>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-md" />
              ))}
            </div>
          ) : participation.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events participated yet.</p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {participation.map((p) => {
                const date = p.startDate
                  ? new Date(p.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''

                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[p.categoryName ?? ''] ?? '#6b7280',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.eventName}</p>
                      <p className="text-muted-foreground text-xs">
                        {date}
                        {p.categoryName ? ` · ${p.categoryName}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {p.approvedHours ?? p.hoursAttended}h
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-none text-[10px]',
                          APPROVAL_STATUS_COLORS[p.approvalStatus as ApprovalStatus] ?? ''
                        )}
                      >
                        {APPROVAL_STATUS_DISPLAY[p.approvalStatus as ApprovalStatus] ??
                          p.approvalStatus}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
