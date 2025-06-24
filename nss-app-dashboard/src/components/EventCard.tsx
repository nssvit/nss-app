'use client'

import Image from 'next/image'

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
  onEdit: () => void
  onViewParticipants: () => void
  onDelete: () => void
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
  onDelete
}: EventCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'area based - 1':
        return 'bg-blue-500'
      case 'college event':
        return 'bg-purple-500'
      case 'camp':
        return 'bg-orange-500'
      case 'workshop':
        return 'bg-indigo-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="card-glass hover-lift rounded-xl flex flex-col transition-all duration-300 ease-out" style={{ padding: '0.85rem' }}>
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="font-semibold text-gray-100 truncate pr-2" 
            style={{ fontSize: '0.94rem' }} 
            title={title}
          >
            {title}
          </h3>
          <span className="text-xs text-gray-400 whitespace-nowrap">{date}</span>
        </div>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">
          {description}
        </p>
        <div className="flex flex-wrap items-center mb-3">
          <span className="tag">
            <span className={`tag-dot ${getCategoryColor(category)}`}></span>
            {category}
          </span>
          <span className="tag">
            <span className="tag-dot bg-green-500"></span>
            {hours} Hrs
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-700/20 mt-auto">
        <div className="flex items-center -space-x-2">
          {participants.map((participant, index) => (
            <Image 
              key={index}
              src={participant.avatar} 
              alt={participant.alt} 
              className="w-5 h-5 rounded-full border-2 border-gray-700/50"
              width={20}
              height={20}
            />
          ))}
          <span className="text-xs text-gray-500 pl-3">+{participantCount}</span>
        </div>
        <div className="flex space-x-1">
          <button 
            title="Edit" 
            className="action-button text-gray-400 hover:text-blue-400 p-1.5 rounded-lg text-xs"
            onClick={onEdit}
          >
            <i className="fas fa-pencil-alt"></i>
          </button>
          <button 
            title="Participants" 
            className="action-button text-gray-400 hover:text-green-400 p-1.5 rounded-lg text-xs"
            onClick={onViewParticipants}
          >
            <i className="fas fa-users"></i>
          </button>
          <button 
            title="Delete" 
            className="action-button text-gray-400 hover:text-red-500 p-1.5 rounded-lg text-xs"
            onClick={onDelete}
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  )
} 