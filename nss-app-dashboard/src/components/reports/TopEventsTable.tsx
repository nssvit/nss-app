'use client'

/**
 * TopEventsTable Component
 * Table showing top events by impact
 */

import type { TopEvent } from './types'

interface TopEventsTableProps {
  events: TopEvent[]
  isMobile: boolean
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'Very High':
      return 'text-green-400 bg-green-900/30'
    case 'High':
      return 'text-blue-400 bg-blue-900/30'
    case 'Medium':
      return 'text-yellow-400 bg-yellow-900/30'
    case 'Low':
      return 'text-red-400 bg-red-900/30'
    default:
      return 'text-gray-400 bg-gray-900/30'
  }
}

export function TopEventsTable({ events, isMobile }: TopEventsTableProps) {
  return (
    <div className="card-glass overflow-hidden rounded-xl">
      <div className="border-b border-gray-700/30 p-4">
        <h3 className="text-lg font-semibold text-gray-100">Top Events by Impact</h3>
      </div>
      <div className="divide-y divide-gray-700/30">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <i className="fas fa-chart-bar mb-3 text-4xl"></i>
            <p>No event data available</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div key={i} className="px-4 py-3 transition-colors hover:bg-gray-800/20">
              {isMobile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-200">{event.name}</h4>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${getImpactColor(event.impact)}`}
                    >
                      {event.impact}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      <i className="fas fa-users mr-1"></i>
                      {event.participants}
                    </span>
                    <span>
                      <i className="fas fa-clock mr-1"></i>
                      {event.hours}h
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-1 font-medium text-gray-200">{event.name}</div>
                  <div className="text-sm text-gray-400">
                    <i className="fas fa-users mr-2"></i>
                    {event.participants}
                  </div>
                  <div className="text-sm text-gray-400">
                    <i className="fas fa-clock mr-2"></i>
                    {event.hours}h
                  </div>
                  <div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${getImpactColor(event.impact)}`}
                    >
                      {event.impact}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
