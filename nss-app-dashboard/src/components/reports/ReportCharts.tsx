'use client'

/**
 * ReportCharts Component
 * Charts for reports using Recharts
 */

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ChartData, CategoryData } from './types'

interface ReportChartsProps {
  chartData: ChartData[]
  categoryData: CategoryData[]
  isMobile: boolean
}

export function ReportCharts({ chartData, categoryData, isMobile }: ReportChartsProps) {
  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} mb-6 gap-6`}>
      {/* Activity Trend Chart */}
      <div className="card-glass rounded-xl p-4">
        <h3 className="mb-4 text-lg font-semibold text-gray-100">Activity Trend</h3>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="#6366f1"
                  name="Events"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#10b981"
                  name="Hours"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Category Distribution Chart */}
      <div className="card-glass rounded-xl p-4">
        <h3 className="mb-4 text-lg font-semibold text-gray-100">Category Distribution</h3>
        <div className="h-64">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData as any[]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={(props: any) =>
                    `${props.name || 'Unknown'}: ${((props.percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
