'use client'

/**
 * ReportMetrics Component
 * Stats cards for reports
 */

import { Skeleton } from '@/components/ui'
import type { ReportMetric } from './types'

interface ReportMetricsProps {
  metrics: ReportMetric[]
  loading: boolean
  isMobile: boolean
}

export function ReportMetrics({ metrics, loading, isMobile }: ReportMetricsProps) {
  if (loading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
      {metrics.map((metric, i) => (
        <div key={i} className="card-glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className={`${metric.color}`}>
              <i className={`${metric.icon} text-lg`}></i>
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${metric.changeType === 'increase' ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}
            >
              {metric.change}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-100 mb-1">{metric.value}</div>
          <div className="text-sm text-gray-400">{metric.title}</div>
        </div>
      ))}
    </div>
  )
}
