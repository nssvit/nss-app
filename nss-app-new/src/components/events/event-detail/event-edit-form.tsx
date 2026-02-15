'use client'

import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface EditFormState {
  eventName: string
  description: string
  startDate: string
  endDate: string
  location: string
  maxParticipants: string
  declaredHours: string
  categoryId: string
  eventStatus: string
}

interface EventEditFormProps {
  editForm: EditFormState
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>
  categoryOptions: { value: string; label: string }[]
  statusOptions: { value: string; label: string }[]
  saving: boolean
  wouldResetAttendance: boolean
  onSave: () => void
  onCancel: () => void
}

export function EventEditForm({
  editForm,
  setEditForm,
  categoryOptions,
  statusOptions,
  saving,
  wouldResetAttendance,
  onSave,
  onCancel,
}: EventEditFormProps) {
  return (
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
          {wouldResetAttendance && (
            <p className="text-destructive mt-1 text-xs font-medium">
              This will reset all attendance records and hours.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          disabled={saving}
          className="flex-1"
        >
          <Save className="mr-1.5 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          <X className="mr-1.5 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
