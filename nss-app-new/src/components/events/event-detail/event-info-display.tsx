'use client'

import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { EventWithStats } from '@/types'

interface EventInfoDisplayProps {
  event: EventWithStats
  participantCount: number
  canManage: boolean
  onEdit: () => void
  confirmDelete: boolean
  deleting: boolean
  onDeleteClick: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

export function EventInfoDisplay({
  event,
  participantCount,
  canManage,
  onEdit,
  confirmDelete,
  deleting,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: EventInfoDisplayProps) {
  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'TBD'

  return (
    <>
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
            {participantCount} participant
            {participantCount !== 1 ? 's' : ''}
          </div>
        </div>
        {canManage && (
          <div className="mt-1 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
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
                  onClick={onDeleteConfirm}
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  onClick={onDeleteCancel}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={onDeleteClick}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <Separator className="my-4" />
    </>
  )
}
