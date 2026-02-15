'use client'

import {
  Check,
  X,
  UserCheck,
  UserX,
  UserPlus,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
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
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Participants</h3>
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
        {participants.length > 0 && (
          <div className="flex gap-2 text-xs">
            <Badge
              variant="secondary"
              className="border-none bg-green-500/20 text-green-400"
            >
              <UserCheck className="mr-1 h-3 w-3" />
              {presentCount} Present
            </Badge>
            <Badge
              variant="secondary"
              className="border-none bg-red-500/20 text-red-400"
            >
              <UserX className="mr-1 h-3 w-3" />
              {absentCount} Absent
            </Badge>
          </div>
        )}
      </div>

      {/* Add Volunteers Picker */}
      {showAddVolunteers && canManage && (
        <div className="mb-3 space-y-2 rounded-md border p-3">
          <Input
            placeholder="Search volunteers..."
            value={volunteerSearch}
            onChange={(e) => onVolunteerSearchChange(e.target.value)}
            className="h-8"
          />
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {availableVolunteers.length === 0 ? (
              <p className="text-muted-foreground py-3 text-center text-sm">
                {volunteerSearch ? 'No volunteers found' : 'All volunteers already added'}
              </p>
            ) : (
              availableVolunteers.map((v) => (
                <label
                  key={v.id}
                  className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={selectedToAdd.includes(v.id)}
                    onCheckedChange={() => onToggleSelectVolunteer(v.id)}
                  />
                  <span>
                    {v.firstName} {v.lastName}
                  </span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    {v.rollNumber}
                  </span>
                </label>
              ))
            )}
          </div>
          {selectedToAdd.length > 0 && (
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
          )}
        </div>
      )}

      {loadingParticipants ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      ) : participants.length === 0 ? (
        <div className="text-muted-foreground py-6 text-center text-sm">
          No participants registered yet.
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
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {p.volunteerName ?? 'Unknown'}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'border-none text-xs',
                      PARTICIPATION_STATUS_COLORS[status] ?? ''
                    )}
                  >
                    {PARTICIPATION_STATUS_DISPLAY[status] ??
                      p.participationStatus}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {p.hoursAttended}h
                  </span>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant={isPresent ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-7 px-2 text-xs',
                        isPresent &&
                          'bg-green-600 hover:bg-green-700'
                      )}
                      disabled={isUpdating}
                      onClick={() =>
                        !isPresent &&
                        onStatusToggle(p.id, p.participationStatus)
                      }
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Present
                    </Button>
                    <Button
                      variant={isAbsent ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-7 px-2 text-xs',
                        isAbsent && 'bg-red-600 hover:bg-red-700'
                      )}
                      disabled={isUpdating}
                      onClick={() =>
                        !isAbsent &&
                        onStatusToggle(p.id, p.participationStatus)
                      }
                    >
                      <X className="mr-1 h-3 w-3" />
                      Absent
                    </Button>
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
