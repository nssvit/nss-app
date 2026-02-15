'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Pencil,
  Check,
  X,
  UserCheck,
  UserX,
  UserPlus,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { EventStatusBadge } from './event-status-badge'
import { cn } from '@/lib/utils'
import {
  EVENT_STATUS,
  EVENT_STATUS_DISPLAY,
  STATUS_TRANSITIONS,
  PARTICIPATION_STATUS_DISPLAY,
  PARTICIPATION_STATUS_COLORS,
} from '@/lib/constants'
import type { EventStatus, ParticipationStatus } from '@/lib/constants'
import type {
  EventWithStats,
  EventCategory,
  EventParticipationWithVolunteer,
} from '@/types'
import { getEventParticipants, updateEvent, deleteEvent, addVolunteersToEvent } from '@/app/actions/events'
import { updateParticipationStatus } from '@/app/actions/attendance'
import { useAuth } from '@/contexts/auth-context'
import { useVolunteers } from '@/hooks/use-volunteers'
import { Checkbox } from '@/components/ui/checkbox'

interface EventDetailModalProps {
  event: EventWithStats | null
  categories: EventCategory[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventUpdated?: () => void
}

export function EventDetailModal({
  event,
  categories,
  open,
  onOpenChange,
  onEventUpdated,
}: EventDetailModalProps) {
  const { hasAnyRole } = useAuth()
  const canManage = hasAnyRole(['admin', 'head'])

  const [participants, setParticipants] = useState<EventParticipationWithVolunteer[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [showAddVolunteers, setShowAddVolunteers] = useState(false)
  const [volunteerSearch, setVolunteerSearch] = useState('')
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([])
  const [addingVolunteers, setAddingVolunteers] = useState(false)

  const { volunteers: allVolunteers } = useVolunteers()

  // Edit form state
  const [editForm, setEditForm] = useState({
    eventName: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: '',
    declaredHours: '',
    categoryId: '',
    eventStatus: '',
  })

  const loadParticipants = useCallback(async () => {
    if (!event) return
    setLoadingParticipants(true)
    try {
      const data = await getEventParticipants(event.id)
      setParticipants(data)
    } catch (err) {
      console.error('Failed to load participants:', err)
    } finally {
      setLoadingParticipants(false)
    }
  }, [event])

  useEffect(() => {
    if (!open || !event) return
    loadParticipants()
  }, [open, event, loadParticipants])

  useEffect(() => {
    if (event && editing) {
      const startStr = event.startDate
        ? new Date(event.startDate).toISOString().split('T')[0]
        : ''
      const endStr = event.endDate
        ? new Date(event.endDate).toISOString().split('T')[0]
        : ''
      setEditForm({
        eventName: event.eventName,
        description: event.description ?? '',
        startDate: startStr,
        endDate: endStr,
        location: event.location ?? '',
        maxParticipants: String(event.maxParticipants ?? ''),
        declaredHours: String(event.declaredHours ?? ''),
        categoryId: String(event.categoryId ?? ''),
        eventStatus: event.eventStatus,
      })
    }
  }, [event, editing])

  // Check if a status change would reset attendance data
  function wouldResetAttendance(): boolean {
    if (!event || editForm.eventStatus === event.eventStatus) return false
    const postAttendance = ['ongoing', 'completed']
    const preAttendance = ['planned', 'registration_open', 'registration_closed']
    return postAttendance.includes(event.eventStatus) && preAttendance.includes(editForm.eventStatus)
  }

  async function handleSaveEdit(force = false) {
    if (!event) return

    // Show inline confirmation if attendance would be reset
    if (!force && wouldResetAttendance()) {
      setConfirmResetOpen(true)
      return
    }

    setSaving(true)
    try {
      await updateEvent(event.id, {
        eventName: editForm.eventName,
        description: editForm.description || undefined,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        location: editForm.location || undefined,
        maxParticipants: editForm.maxParticipants
          ? Number(editForm.maxParticipants)
          : undefined,
        declaredHours: editForm.declaredHours
          ? Number(editForm.declaredHours)
          : undefined,
        categoryId: editForm.categoryId
          ? Number(editForm.categoryId)
          : undefined,
        eventStatus: editForm.eventStatus || undefined,
      })
      const resetted = wouldResetAttendance()
      toast.success(resetted ? 'Event updated — attendance has been reset' : 'Event updated')
      setEditing(false)
      onEventUpdated?.()
      if (resetted) loadParticipants() // refresh participant list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusToggle(
    participantId: string,
    currentStatus: string
  ) {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present'
    const hours = newStatus === 'present' ? (event?.declaredHours ?? 0) : 0
    setUpdatingId(participantId)
    try {
      await updateParticipationStatus(participantId, newStatus, hours)
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? { ...p, participationStatus: newStatus, hoursAttended: hours }
            : p
        )
      )
      toast.success(
        `Marked as ${newStatus === 'present' ? 'Present' : 'Absent'}`
      )

      // Auto-set event to "ongoing" when attendance starts (admin can later mark "completed")
      if (
        event &&
        event.eventStatus !== 'ongoing' &&
        event.eventStatus !== 'completed' &&
        event.eventStatus !== 'cancelled'
      ) {
        try {
          await updateEvent(event.id, { eventStatus: 'ongoing' })
          onEventUpdated?.()
        } catch {
          // Non-critical — attendance was saved, status update is best-effort
        }
      }
    } catch (err) {
      toast.error('Failed to update status')
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete() {
    if (!event) return
    setDeleting(true)
    try {
      await deleteEvent(event.id)
      toast.success('Event deleted')
      setConfirmDelete(false)
      onOpenChange(false)
      onEventUpdated?.()
    } catch (err) {
      toast.error('Failed to delete — please try again')
      console.error('Delete event error:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Filter volunteers not already in the event
  const participantVolunteerIds = new Set(participants.map((p) => p.volunteerId))
  const availableVolunteers = allVolunteers.filter((v) => {
    if (participantVolunteerIds.has(v.id)) return false
    if (!volunteerSearch) return true
    const q = volunteerSearch.toLowerCase()
    return (
      v.firstName.toLowerCase().includes(q) ||
      v.lastName.toLowerCase().includes(q) ||
      v.rollNumber.toLowerCase().includes(q)
    )
  })

  function toggleSelectVolunteer(id: string) {
    setSelectedToAdd((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  async function handleAddVolunteers() {
    if (!event || selectedToAdd.length === 0) return
    setAddingVolunteers(true)
    try {
      const { added } = await addVolunteersToEvent(event.id, selectedToAdd)
      toast.success(`Added ${added} volunteer${added !== 1 ? 's' : ''}`)
      setSelectedToAdd([])
      setVolunteerSearch('')
      setShowAddVolunteers(false)
      loadParticipants()
      onEventUpdated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add volunteers')
    } finally {
      setAddingVolunteers(false)
    }
  }

  if (!event) return null

  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'TBD'

  const categoryOptions = categories.map((c) => ({
    value: c.id.toString(),
    label: c.categoryName,
  }))
  const validNextStatuses = STATUS_TRANSITIONS[event.eventStatus] ?? []
  const statusOptions = Object.values(EVENT_STATUS)
    .filter((s) => s === event.eventStatus || validNextStatuses.includes(s))
    .map((s) => ({
      value: s,
      label: EVENT_STATUS_DISPLAY[s as EventStatus],
    }))

  const presentCount = participants.filter(
    (p) => p.participationStatus === 'present'
  ).length
  const absentCount = participants.filter(
    (p) => p.participationStatus === 'absent'
  ).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] grid-rows-[auto_1fr] overflow-hidden sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2 pr-8">
            <DialogTitle className="text-lg">{event.eventName}</DialogTitle>
            <EventStatusBadge status={event.eventStatus} />
          </div>
        </DialogHeader>

        <div className="-mr-2 overflow-y-auto pr-2">
          {/* Edit Mode */}
          {editing ? (
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium">Event Name</label>
                <Input
                  value={editForm.eventName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, eventName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">
                    Max Participants
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={editForm.maxParticipants}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        maxParticipants: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Declared Hours</label>
                  <Input
                    type="number"
                    min={1}
                    max={240}
                    value={editForm.declaredHours}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        declaredHours: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={editForm.categoryId}
                    onValueChange={(v) =>
                      setEditForm((f) => ({ ...f, categoryId: v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editForm.eventStatus}
                    onValueChange={(v) =>
                      setEditForm((f) => ({ ...f, eventStatus: v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {wouldResetAttendance() && (
                    <p className="text-destructive mt-1 text-xs font-medium">
                      This will reset all attendance records and hours.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSaveEdit()}
                  disabled={saving}
                  className="flex-1"
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Event Info */}
              <div className="grid gap-2">
                {event.description && (
                  <p className="text-muted-foreground text-sm">
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {event.categoryName && (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: event.categoryColor ?? '#6b7280',
                        }}
                      />
                      {event.categoryName}
                    </div>
                  )}
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formattedDate}
                  </div>
                  {event.location && (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                  )}
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {event.declaredHours}h credits
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {participants.length} participant
                    {participants.length !== 1 ? 's' : ''}
                  </div>
                </div>
                {canManage && (
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {confirmDelete ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-destructive text-xs font-medium">
                          Delete this event?
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleting}
                          onClick={handleDelete}
                        >
                          {deleting ? 'Deleting...' : 'Yes, delete'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleting}
                          onClick={() => setConfirmDelete(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Participants */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Participants</h3>
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setShowAddVolunteers(!showAddVolunteers)
                          setSelectedToAdd([])
                          setVolunteerSearch('')
                        }}
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
                      onChange={(e) => setVolunteerSearch(e.target.value)}
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
                              onCheckedChange={() => toggleSelectVolunteer(v.id)}
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
                        onClick={handleAddVolunteers}
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
                                  handleStatusToggle(p.id, p.participationStatus)
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
                                  handleStatusToggle(p.id, p.participationStatus)
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
            </>
          )}
        </div>
      </DialogContent>

      {/* Attendance reset confirmation */}
      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Attendance?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the status back will reset all attendance records — present/absent marks and hours will be cleared for every participant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmResetOpen(false)
                handleSaveEdit(true)
              }}
            >
              Reset &amp; Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
