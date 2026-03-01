'use client'

import {
  Check,
  X,
  UserCheck,
  UserX,
  Users,
  UserPlus,
  ChevronUp,
  Clock,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  PARTICIPATION_STATUS_DISPLAY,
  PARTICIPATION_STATUS_COLORS,
} from '@/lib/constants'
import type { ParticipationStatus } from '@/lib/constants'
import type { EventParticipationWithVolunteer } from '@/types'

interface VolunteerOption {
  id: string
  firstName: string
  lastName: string
  rollNumber: string
}

interface ParticipantListProps {
  participants: EventParticipationWithVolunteer[]
  loadingParticipants: boolean
  canManage: boolean
  updatingId: string | null
  onStatusToggle: (participantId: string, currentStatus: string) => void
  // Add volunteers
  showAddVolunteers: boolean
  onToggleAddVolunteers: () => void
  volunteerSearch: string
  onVolunteerSearchChange: (value: string) => void
  availableVolunteers: VolunteerOption[]
  selectedToAdd: string[]
  onToggleSelectVolunteer: (id: string) => void
  addingVolunteers: boolean
  onAddVolunteers: () => void
}

export function ParticipantList({
  participants,
  loadingParticipants,
  canManage,
  updatingId,
  onStatusToggle,
  showAddVolunteers,
  onToggleAddVolunteers,
  volunteerSearch,
  onVolunteerSearchChange,
  availableVolunteers,
  selectedToAdd,
  onToggleSelectVolunteer,
  addingVolunteers,
  onAddVolunteers,
}: ParticipantListProps) {
  const presentCount = participants.filter(
    (p) => p.participationStatus === 'present'
  ).length
  const absentCount = participants.filter(
    (p) => p.participationStatus === 'absent'
  ).length

  return (
    <div>
      <Separator className="my-4" />

      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Participants</h3>
          {participants.length > 0 && (
            <div className="flex gap-1.5">
              <Badge
                variant="secondary"
                className="border-none bg-green-500/15 px-2 py-0.5 text-xs text-green-500 dark:text-green-400"
              >
                <UserCheck className="mr-1 h-3 w-3" />
                {presentCount}
              </Badge>
              <Badge
                variant="secondary"
                className="border-none bg-red-500/15 px-2 py-0.5 text-xs text-red-500 dark:text-red-400"
              >
                <UserX className="mr-1 h-3 w-3" />
                {absentCount}
              </Badge>
            </div>
          )}
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onToggleAddVolunteers}
          >
            {showAddVolunteers ? (
              <ChevronUp className="mr-1 h-3 w-3" />
            ) : (
              <UserPlus className="mr-1 h-3 w-3" />
            )}
            {showAddVolunteers ? 'Close' : 'Add'}
          </Button>
        )}
      </div>

      {/* Add Volunteers Picker */}
      {showAddVolunteers && canManage && (
        <div className="mb-3 overflow-hidden rounded-lg border">
          {/* Search header */}
          <div className="bg-muted/40 border-b px-3 py-2">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search by name or roll number..."
                value={volunteerSearch}
                onChange={(e) => onVolunteerSearchChange(e.target.value)}
                className="h-8 border-none bg-transparent pl-8 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Volunteer list */}
          <div className="max-h-48 overflow-y-auto">
            {availableVolunteers.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center gap-1.5 py-6 text-center">
                <Users className="h-5 w-5 opacity-40" />
                <p className="text-sm">
                  {volunteerSearch ? 'No volunteers found' : 'All volunteers already added'}
                </p>
              </div>
            ) : (
              availableVolunteers.map((v) => {
                const isSelected = selectedToAdd.includes(v.id)
                return (
                  <label
                    key={v.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 text-sm transition-colors last:border-b-0',
                      isSelected
                        ? 'bg-primary/5'
                        : 'hover:bg-accent/50',
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelectVolunteer(v.id)}
                    />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className={cn('truncate', isSelected && 'font-medium')}>
                        {v.firstName} {v.lastName}
                      </span>
                      <span className="text-muted-foreground shrink-0 font-mono text-xs">
                        {v.rollNumber}
                      </span>
                    </div>
                  </label>
                )
              })
            )}
          </div>

          {/* Sticky action footer */}
          {selectedToAdd.length > 0 && (
            <div className="bg-muted/40 border-t px-3 py-2">
              <Button
                size="sm"
                className="w-full"
                disabled={addingVolunteers}
                onClick={onAddVolunteers}
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                {addingVolunteers
                  ? 'Adding...'
                  : `Add ${selectedToAdd.length} Volunteer${selectedToAdd.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </div>
      )}

      {loadingParticipants ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : participants.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
          <Users className="h-8 w-8 opacity-40" />
          <p className="text-sm">No participants registered yet.</p>
        </div>
      ) : (
        <div className="max-h-[40vh] space-y-1 overflow-y-auto">
          {participants.map((p) => {
            const status =
              p.participationStatus as ParticipationStatus
            const isPresent = status === 'present'
            const isAbsent = status === 'absent'
            const isUpdating = updatingId === p.id

            return (
              <div
                key={p.id}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isPresent && 'bg-green-500/5',
                  isAbsent && 'bg-red-500/5',
                  !isPresent && !isAbsent && 'hover:bg-accent/50',
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* Status dot */}
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      isPresent && 'bg-green-500',
                      isAbsent && 'bg-red-500',
                      !isPresent && !isAbsent && 'bg-muted-foreground/40',
                    )}
                  />
                  <span className="truncate font-medium">
                    {p.volunteerName ?? 'Unknown'}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'shrink-0 border-none text-xs',
                      PARTICIPATION_STATUS_COLORS[status] ?? ''
                    )}
                  >
                    {PARTICIPATION_STATUS_DISPLAY[status] ??
                      p.participationStatus}
                  </Badge>
                  {p.hoursAttended > 0 && (
                    <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {p.hoursAttended}h
                    </span>
                  )}
                </div>

                {canManage && (
                  <div className="ml-2 flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                        isPresent
                          ? 'border-green-500/30 bg-green-500 text-white hover:bg-green-600'
                          : 'border-border hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-500',
                        isUpdating && 'pointer-events-none opacity-50',
                      )}
                      disabled={isUpdating}
                      onClick={() =>
                        !isPresent &&
                        onStatusToggle(p.id, p.participationStatus)
                      }
                      title="Mark present"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                        isAbsent
                          ? 'border-red-500/30 bg-red-500 text-white hover:bg-red-600'
                          : 'border-border hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500',
                        isUpdating && 'pointer-events-none opacity-50',
                      )}
                      disabled={isUpdating}
                      onClick={() =>
                        !isAbsent &&
                        onStatusToggle(p.id, p.participationStatus)
                      }
                      title="Mark absent"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
