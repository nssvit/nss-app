/**
 * Events Types
 */

export interface Event {
  id: string
  eventName: string
  eventDescription: string
  eventDate: string
  declaredHours: number
  categoryName: string
  createdByName: string
  participantCount: number
  isActive: boolean
  createdAt: string
  participantAvatars?: { avatar: string; alt: string }[]
}

export interface EventCategory {
  id: string | number
  categoryName: string
  isActive: boolean
}

export interface EventFilters {
  searchTerm: string
  categoryFilter: string
  sessionFilter: string
}
