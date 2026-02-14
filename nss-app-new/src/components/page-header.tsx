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
    <div className="flex items-center justify-between">
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}
