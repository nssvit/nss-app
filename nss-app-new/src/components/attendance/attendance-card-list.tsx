import { AttendanceCard } from './attendance-card'

interface AttendanceEvent {
  id: string
  eventName: string
  startDate?: Date | string
  location?: string | null
  eventStatus: string
  categoryName?: string | null
  categoryColor?: string | null
  participantCount?: number
  maxParticipants?: number | null
  totalHours?: number
  declaredHours: number
}

interface AttendanceCardListProps {
  events: AttendanceEvent[]
}

export function AttendanceCardList({ events }: AttendanceCardListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <AttendanceCard key={event.id} event={event} />
      ))}
    </div>
  )
}
