import { VolunteerCard } from './volunteer-card'
import type { VolunteerWithStats } from '@/types'

interface VolunteersCardListProps {
  volunteers: VolunteerWithStats[]
  onVolunteerClick?: (volunteer: VolunteerWithStats) => void
}

export function VolunteersCardList({ volunteers, onVolunteerClick }: VolunteersCardListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {volunteers.map((volunteer) => (
        <VolunteerCard
          key={volunteer.id}
          volunteer={volunteer}
          onClick={onVolunteerClick ? () => onVolunteerClick(volunteer) : undefined}
        />
      ))}
    </div>
  )
}
