'use client'

/**
 * ProfileHistory Component
 * Participation history list
 */

import type { ParticipationHistory } from './types'

interface ProfileHistoryProps {
  history: ParticipationHistory[]
}

export function ProfileHistory({ history }: ProfileHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="py-8 text-center">
        <i className="fas fa-history mb-3 text-4xl text-gray-600"></i>
        <p className="text-gray-400">No participation history yet</p>
        <p className="text-sm text-gray-500">Register for events to start building your history!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-100">Participation History</h3>
      <div className="space-y-3">
        {history.map((item, index) => (
          <div key={`${item.eventId}-${index}`} className="rounded-lg bg-gray-800/30 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-100">{item.eventName}</h4>
                <p className="text-sm text-gray-400">
                  {item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'TBD'} &bull;{' '}
                  {item.categoryName || 'General'}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  item.approvalStatus === 'approved'
                    ? 'bg-green-500/20 text-green-400'
                    : item.approvalStatus === 'rejected'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {item.approvalStatus}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                <i className="fas fa-clock mr-1"></i>
                {item.hoursAttended}h attended
              </span>
              {item.approvedHours !== null && (
                <span className="text-green-400">
                  <i className="fas fa-check-circle mr-1"></i>
                  {item.approvedHours}h approved
                </span>
              )}
              <span
                className={`${
                  item.participationStatus === 'attended' || item.participationStatus === 'present'
                    ? 'text-green-400'
                    : item.participationStatus === 'absent'
                      ? 'text-red-400'
                      : 'text-blue-400'
                }`}
              >
                {item.participationStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
