'use client'

import { useState } from 'react'
import { CheckCircle, Users, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PARTICIPATION_STATUS_COLORS,
  PARTICIPATION_STATUS_DISPLAY,
  type ParticipationStatus,
} from '@/lib/constants'
import { useAttendanceManager } from '@/hooks/use-attendance'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AttendanceManager() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const {
    events,
    participants,
    loading,
    attendanceMap,
    toggleAttendance,
    markAllPresent,
    markAllAbsent,
    submitAttendance,
  } = useAttendanceManager(selectedEventId)

  const presentCount = Object.values(attendanceMap).filter((v) => v === 'present').length
  const absentCount = Object.values(attendanceMap).filter((v) => v === 'absent').length

  const handleSubmit = async () => {
    setSaving(true)
    await submitAttendance()
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark Attendance"
        description="Record attendance for events. Select an event to view and mark participant attendance."
      />

      <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center')}>
        <Select
          value={selectedEventId ?? ''}
          onValueChange={(val) => setSelectedEventId(val || null)}
        >
          <SelectTrigger className="w-full sm:w-[320px]">
            <SelectValue placeholder="Select an event..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.eventName}
                {event.eventDate ? ` (${new Date(event.eventDate).toLocaleDateString()})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedEventId && participants.length > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={markAllPresent}>
              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
              Mark All Present
            </Button>
            <Button size="sm" variant="outline" onClick={markAllAbsent}>
              <XCircle className="mr-1 h-4 w-4 text-red-500" />
              Mark All Absent
            </Button>
          </div>
        )}
      </div>

      {!selectedEventId ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted rounded-full p-4">
            <Users className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Select an Event</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Choose an event from the dropdown to view and manage participant attendance.
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : participants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted rounded-full p-4">
            <Users className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No Participants</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            No participants are registered for this event yet.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Present: {presentCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Absent: {absentCount}</span>
            </div>
            <div className="text-muted-foreground">Total: {participants.length}</div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => {
                  const isPresent = attendanceMap[p.id] === 'present'
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.volunteerName ??
                          (p.volunteer
                            ? `${p.volunteer.firstName} ${p.volunteer.lastName}`
                            : p.volunteerId)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.volunteer?.rollNumber ?? '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.volunteer?.branch ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            PARTICIPATION_STATUS_COLORS[
                              p.participationStatus as ParticipationStatus
                            ]
                          )}
                        >
                          {PARTICIPATION_STATUS_DISPLAY[
                            p.participationStatus as ParticipationStatus
                          ] ?? p.participationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            isPresent
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          )}
                        >
                          {isPresent ? 'Present' : 'Absent'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={isPresent ? 'outline' : 'default'}
                          onClick={() => toggleAttendance(p.id)}
                          className={cn(
                            isPresent
                              ? 'text-red-500 hover:text-red-600'
                              : 'bg-green-600 hover:bg-green-700'
                          )}
                        >
                          {isPresent ? (
                            <>
                              <XCircle className="mr-1 h-4 w-4" />
                              Mark Absent
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Mark Present
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
