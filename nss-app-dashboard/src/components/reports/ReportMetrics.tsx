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
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} mb-6 gap-4`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} mb-6 gap-4`}>
      {metrics.map((metric, i) => (
        <div key={i} className="card-glass rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className={`${metric.color}`}>
              <i className={`${metric.icon} text-lg`}></i>
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs ${metric.changeType === 'increase' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}
            >
              {metric.change}
            </span>
          </div>
          <div className="mb-1 text-2xl font-bold text-gray-100">{metric.value}</div>
          <div className="text-sm text-gray-400">{metric.title}</div>
        </div>
      ))}
    </div>
  )
}
