'use client'

/**
 * ProfileStats Component
 * Displays stats cards grid
 */

import type { ProfileStats as Stats } from './types'

interface ProfileStatsProps {
  stats: Stats
  isMobile: boolean
}

export function ProfileStats({ stats, isMobile }: ProfileStatsProps) {
  return (
    <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} mb-6 gap-4`}>
      <div className="card-glass rounded-xl p-4 text-center">
        <div className="mb-1 text-2xl font-bold text-blue-400">{stats.eventsParticipated}</div>
        <div className="text-sm text-gray-400">Events Participated</div>
      </div>
      <div className="card-glass rounded-xl p-4 text-center">
        <div className="mb-1 text-2xl font-bold text-green-400">{stats.totalHours}</div>
        <div className="text-sm text-gray-400">Total Hours</div>
      </div>
      <div className="card-glass rounded-xl p-4 text-center">
        <div className="mb-1 text-2xl font-bold text-purple-400">{stats.approvedHours}</div>
        <div className="text-sm text-gray-400">Approved Hours</div>
      </div>
      <div className="card-glass rounded-xl p-4 text-center">
        <div className="mb-1 text-2xl font-bold text-orange-400">{stats.pendingReviews}</div>
        <div className="text-sm text-gray-400">Pending Reviews</div>
      </div>
    </div>
  )
}
