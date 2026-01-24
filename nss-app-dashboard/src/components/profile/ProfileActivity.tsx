'use client'

/**
 * ProfileActivity Component
 * Activity chart and statistics summary
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyActivity, ProfileStats } from './types'

interface ProfileActivityProps {
  monthlyActivity: MonthlyActivity[]
  stats: ProfileStats
}

export function ProfileActivity({ monthlyActivity, stats }: ProfileActivityProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Activity Chart - Last 6 Months</h3>
        <div className="h-64 bg-gray-800/30 rounded-lg p-4">
          {monthlyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyActivity} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Bar dataKey="events" name="Events" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="hours" name="Hours" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <i className="fas fa-chart-bar text-4xl mb-3"></i>
                <p>No activity data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Statistics Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-400">{stats.eventsParticipated}</div>
            <div className="text-sm text-gray-400">Total Events</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.totalHours}</div>
            <div className="text-sm text-gray-400">Total Hours</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{stats.approvedHours}</div>
            <div className="text-sm text-gray-400">Approved Hours</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {stats.totalHours > 0 ? Math.round((stats.approvedHours / stats.totalHours) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-400">Approval Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}
