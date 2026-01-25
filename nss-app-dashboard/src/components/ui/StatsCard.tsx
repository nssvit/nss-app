'use client'

interface StatsCardProps {
  title: string
  value: number | string
  icon: string
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'error' | 'purple' | 'orange'
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
}

export function StatsCard({ title, value, icon, variant = 'primary', change }: StatsCardProps) {
  return (
    <div className={`card-glass h-full rounded-xl p-6 stats-card-${variant}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {change && (
            <div
              className={`mt-2 flex items-center text-sm ${
                change.type === 'increase'
                  ? 'text-green-400'
                  : change.type === 'decrease'
                    ? 'text-red-400'
                    : 'text-gray-400'
              }`}
            >
              {change.type !== 'neutral' && (
                <i
                  className={`fas ${
                    change.type === 'increase' ? 'fa-arrow-up' : 'fa-arrow-down'
                  } mr-1 text-xs`}
                ></i>
              )}
              <span>{Math.abs(change.value)}% from last month</span>
            </div>
          )}
        </div>
        <div className="stats-icon-wrapper rounded-lg p-3">
          <i className={`${icon} stats-icon text-xl`}></i>
        </div>
      </div>
    </div>
  )
}
