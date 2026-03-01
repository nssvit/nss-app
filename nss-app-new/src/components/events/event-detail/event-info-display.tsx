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
    <div className="space-y-4">
      {event.description && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {event.description}
        </p>
      )}

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {event.categoryName && (
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: event.categoryColor ?? '#6b7280',
              }}
            />
            <span className="truncate text-sm font-medium">
              {event.categoryName}
            </span>
          </div>
        )}
        <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2.5">
          <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="truncate text-sm font-medium">{formattedDate}</span>
        </div>
        {event.location && (
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2.5">
            <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-medium">
              {event.location}
            </span>
          </div>
        )}
        <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2.5">
          <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            {event.declaredHours}h credits
          </span>
        </div>
        <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2.5">
          <Users className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            {participantCount} participant
            {participantCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {canManage && (
        <div className="flex items-center gap-2">
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
  )
}
