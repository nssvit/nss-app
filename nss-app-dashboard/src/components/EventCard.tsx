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
    <div className="card-glass card-interactive rounded-xl flex flex-col px-4 py-3.5 md:px-3.5 md:py-3 lg:px-4 lg:py-3.5 h-full">
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-3 md:mb-2">
          <h3 className="text-heading-4 truncate pr-2" title={title}>
            {title}
          </h3>
          <span className="text-caption whitespace-nowrap">{date}</span>
        </div>
        <p
          className="text-body-sm mb-4 md:mb-3 leading-relaxed line-clamp-3 md:line-clamp-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {description}
        </p>
        <div className="flex flex-wrap items-center mb-4 md:mb-3 gap-2">
          <span className={getCategoryBadgeClass(category)}>{category}</span>
          <span className="badge badge-success text-xs">{hours} Hrs</span>
        </div>
      </div>
      <div
        className="flex items-center justify-between pt-3 border-t mt-auto"
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
                  className="w-6 h-6 md:w-5 md:h-5 rounded-full border-2"
                  style={{ borderColor: 'var(--bg-primary)' }}
                  width={24}
                  height={24}
                />
              ) : (
                <div
                  key={`avatar-${index}`}
                  className="w-6 h-6 md:w-5 md:h-5 rounded-full border-2 bg-indigo-600 flex items-center justify-center text-white text-xs font-medium"
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
                  className="w-6 h-6 md:w-5 md:h-5 rounded-full border-2 bg-gray-600 flex items-center justify-center"
                  style={{ borderColor: 'var(--bg-primary)' }}
                >
                  <i className="fas fa-user text-gray-400 text-xs"></i>
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
