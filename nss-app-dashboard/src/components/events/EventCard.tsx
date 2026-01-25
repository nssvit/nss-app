'use client'

import Image from 'next/image'
import { getCategoryBadgeClass } from '@/utils/styles/badges'

interface EventCardProps {
  title: string
  date: string
  description: string
  category: string
  hours: string
  participants: Array<{
    avatar: string
    alt: string
  }>
  participantCount: number
  onEdit?: () => void
  onViewParticipants: () => void
  onDelete?: () => void
  createdBy?: string
  canEdit?: boolean
}

export function EventCard({
  title,
  date,
  description,
  category,
  hours,
  participants,
  participantCount,
  onEdit,
  onViewParticipants,
  onDelete,
  createdBy,
  canEdit = false,
}: EventCardProps) {
  return (
    <div className="card-glass card-interactive flex h-full flex-col rounded-xl px-4 py-3.5 md:px-3.5 md:py-3 lg:px-4 lg:py-3.5">
      <div className="flex-grow">
        <div className="mb-3 flex items-start justify-between md:mb-2">
          <h3 className="text-heading-4 truncate pr-2" title={title}>
            {title}
          </h3>
          <span className="text-caption whitespace-nowrap">{date}</span>
        </div>
        <p
          className="text-body-sm mb-4 line-clamp-3 leading-relaxed md:mb-3 md:line-clamp-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {description}
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-2 md:mb-3">
          <span className={getCategoryBadgeClass(category)}>{category}</span>
          <span className="badge badge-success text-xs">{hours} Hrs</span>
        </div>
      </div>
      <div
        className="mt-auto flex items-center justify-between border-t pt-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center -space-x-2">
          {participants.length > 0 ? (
            participants.map((participant, index) =>
              participant.avatar ? (
                <Image
                  key={`avatar-${index}`}
                  src={participant.avatar}
                  alt={participant.alt}
                  className="h-6 w-6 rounded-full border-2 md:h-5 md:w-5"
                  style={{ borderColor: 'var(--bg-primary)' }}
                  width={24}
                  height={24}
                />
              ) : (
                <div
                  key={`avatar-${index}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 bg-indigo-600 text-xs font-medium text-white md:h-5 md:w-5"
                  style={{ borderColor: 'var(--bg-primary)' }}
                  title={participant.alt}
                >
                  {participant.alt?.charAt(0) || '?'}
                </div>
              )
            )
          ) : (
            <div className="flex items-center -space-x-1">
              {[0, 1, 2].slice(0, Math.min(3, participantCount)).map((i) => (
                <div
                  key={`placeholder-${i}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 bg-gray-600 md:h-5 md:w-5"
                  style={{ borderColor: 'var(--bg-primary)' }}
                >
                  <i className="fas fa-user text-xs text-gray-400"></i>
                </div>
              ))}
            </div>
          )}
          <span className="text-caption pl-3">
            {participantCount > 0 ? `+${participantCount}` : '0'}
          </span>
        </div>
        <div className="flex gap-1">
          <button title="Edit" className="btn btn-icon btn-sm btn-ghost" onClick={onEdit}>
            <i className="fas fa-pencil-alt"></i>
          </button>
          <button
            title="Participants"
            className="btn btn-icon btn-sm btn-ghost"
            onClick={onViewParticipants}
          >
            <i className="fas fa-users"></i>
          </button>
          <button title="Delete" className="btn btn-icon btn-sm btn-ghost" onClick={onDelete}>
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
