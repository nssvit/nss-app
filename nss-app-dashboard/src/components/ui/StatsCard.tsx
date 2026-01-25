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
    <div className={`card-glass rounded-xl p-6 h-full stats-card-${variant}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {change && (
            <div
              className={`flex items-center mt-2 text-sm ${
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
        <div className="stats-icon-wrapper p-3 rounded-lg">
          <i className={`${icon} text-xl stats-icon`}></i>
        </div>
      </div>
    </div>
  )
}
