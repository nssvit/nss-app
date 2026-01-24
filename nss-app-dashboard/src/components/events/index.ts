/**
 * Events Components
 * Re-exports all event-related components
 */

export { EventFilters } from './EventFilters'
export { EventsGrid } from './EventsGrid'
export type * from './types'

// Re-export existing components that are already modular
export { EventCard } from '../EventCard'
export { EventModal } from '../EventModal'
export { EventParticipantsModal } from '../EventParticipantsModal'
