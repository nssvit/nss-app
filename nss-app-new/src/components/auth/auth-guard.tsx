'use client'

import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, authError, currentUser, retryAuth } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto h-4 w-48" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (authError && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <AlertCircle className="text-destructive mx-auto size-12" />
          <p className="text-destructive text-sm">{authError}</p>
          <Button variant="outline" onClick={retryAuth}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return <>{children}</>
}
