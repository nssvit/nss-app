'use client'

import { Calendar, Clock, CheckCircle } from 'lucide-react'
import { StatsCard } from '@/components/stats-card'
import type { EventParticipationWithEvent } from '@/types'

interface ProfileStatsProps {
  participations: EventParticipationWithEvent[]
}

export function ProfileStats({ participations }: ProfileStatsProps) {
  const totalEvents = participations.length
  const totalHours = participations.reduce((sum, p) => sum + p.hoursAttended, 0)
  const approvedHours = participations
    .filter((p) => p.approvalStatus === 'approved')
    .reduce((sum, p) => sum + p.hoursAttended, 0)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatsCard title="Total Events" value={totalEvents} icon={Calendar} />
      <StatsCard title="Total Hours" value={totalHours} icon={Clock} />
      <StatsCard title="Approved Hours" value={approvedHours} icon={CheckCircle} />
    </div>
  )
}
