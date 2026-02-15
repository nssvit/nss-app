'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
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
import { EventStatusBadge } from '../event-status-badge'
import {
  EVENT_STATUS,
  EVENT_STATUS_DISPLAY,
  STATUS_TRANSITIONS,
} from '@/lib/constants'
import type { EventStatus } from '@/lib/constants'
import type {
  EventWithStats,
  EventCategory,
  EventParticipationWithVolunteer,
} from '@/types'
import { getEventParticipants, updateEvent, deleteEvent, addVolunteersToEvent } from '@/app/actions/events'
import { updateParticipationStatus } from '@/app/actions/attendance'
import { useAuth } from '@/contexts/auth-context'
import { useVolunteers } from '@/hooks/use-volunteers'
import { EventInfoDisplay } from './event-info-display'
import { EventEditForm, type EditFormState } from './event-edit-form'
import { ParticipantList } from './participant-list'

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
  const [editForm, setEditForm] = useState<EditFormState>({
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

      // Auto-set event to "ongoing" when attendance starts
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
  const availableVolunteers = useMemo(() => {
    const participantVolunteerIds = new Set(participants.map((p) => p.volunteerId))
    return allVolunteers.filter((v) => {
      if (participantVolunteerIds.has(v.id)) return false
      if (!volunteerSearch) return true
      const q = volunteerSearch.toLowerCase()
      return (
        v.firstName.toLowerCase().includes(q) ||
        v.lastName.toLowerCase().includes(q) ||
        v.rollNumber.toLowerCase().includes(q)
      )
    })
  }, [allVolunteers, participants, volunteerSearch])

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
          {editing ? (
            <EventEditForm
              editForm={editForm}
              setEditForm={setEditForm}
              categoryOptions={categoryOptions}
              statusOptions={statusOptions}
              saving={saving}
              wouldResetAttendance={wouldResetAttendance()}
              onSave={() => handleSaveEdit()}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <EventInfoDisplay
                event={event}
                participantCount={participants.length}
                canManage={canManage}
                onEdit={() => setEditing(true)}
                confirmDelete={confirmDelete}
                deleting={deleting}
                onDeleteClick={() => setConfirmDelete(true)}
                onDeleteConfirm={handleDelete}
                onDeleteCancel={() => setConfirmDelete(false)}
              />

              <ParticipantList
                participants={participants}
                loadingParticipants={loadingParticipants}
                canManage={canManage}
                updatingId={updatingId}
                onStatusToggle={handleStatusToggle}
                showAddVolunteers={showAddVolunteers}
                onToggleAddVolunteers={() => {
                  setShowAddVolunteers(!showAddVolunteers)
                  setSelectedToAdd([])
                  setVolunteerSearch('')
                }}
                volunteerSearch={volunteerSearch}
                onVolunteerSearchChange={setVolunteerSearch}
                availableVolunteers={availableVolunteers}
                selectedToAdd={selectedToAdd}
                onToggleSelectVolunteer={toggleSelectVolunteer}
                addingVolunteers={addingVolunteers}
                onAddVolunteers={handleAddVolunteers}
              />
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
