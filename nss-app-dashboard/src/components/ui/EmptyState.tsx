'use client'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon = 'fa-inbox',
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'text-4xl',
      title: 'text-heading-4',
      description: 'text-body-sm',
    },
    md: {
      container: 'py-12',
      icon: 'text-5xl',
      title: 'text-heading-3',
      description: 'text-body',
    },
    lg: {
      container: 'py-16',
      icon: 'text-6xl',
      title: 'text-heading-2',
      description: 'text-body-lg',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div className={`flex flex-col items-center justify-center text-center ${classes.container}`}>
      <div className="mb-4 opacity-50" style={{ color: 'var(--text-quaternary)' }}>
        <i className={`fas ${icon} ${classes.icon}`}></i>
      </div>
      <h3 className={`${classes.title} mb-2`} style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p
          className={`${classes.description} max-w-md mb-6`}
          style={{ color: 'var(--text-tertiary)' }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
