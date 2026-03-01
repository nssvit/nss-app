'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/contexts/page-title-context'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { setTitle } = usePageTitle()

  useEffect(() => {
    setTitle(title)
    return () => setTitle('')
  }, [title, setTitle])

  if (!description && !actions) return null

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-2 sm:items-center sm:justify-between">
      {description && <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
