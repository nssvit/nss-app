import { HoursCard } from './hours-card'
import type { EventParticipationWithVolunteer } from '@/types'

interface HoursCardListProps {
  participations: EventParticipationWithVolunteer[]
  onApprove: (participation: EventParticipationWithVolunteer) => void
  onReject: (participation: EventParticipationWithVolunteer) => void
}

export function HoursCardList({ participations, onApprove, onReject }: HoursCardListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {participations.map((p) => (
        <HoursCard
          key={p.id}
          participation={p}
          onApprove={() => onApprove(p)}
          onReject={() => onReject(p)}
        />
      ))}
    </div>
  )
}
