'use client'

import { useEffect } from 'react'
import { AlertTriangle, DatabaseZap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  const isDbError = error.message?.includes('database') || error.message?.includes('DATABASE_URL')
  const Icon = isDbError ? DatabaseZap : AlertTriangle

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Icon className="text-destructive h-12 w-12" />
      <h2 className="text-xl font-semibold">
        {isDbError ? 'Database Connection Failed' : 'Something went wrong'}
      </h2>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        {isDbError
          ? 'Could not connect to the database. Ensure DATABASE_URL or NEON_DATABASE_URL is set in your environment variables.'
          : 'An unexpected error occurred. Please try again or contact the administrator if this persists.'}
      </p>
      {error.digest && (
        <p className="text-muted-foreground text-xs">Error ID: {error.digest}</p>
      )}
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}
