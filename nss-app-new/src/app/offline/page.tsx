'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="space-y-4 text-center">
        <WifiOff className="text-muted-foreground mx-auto size-16" />
        <h1 className="text-2xl font-bold">You are offline</h1>
        <p className="text-muted-foreground">
          Please check your internet connection and try again.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  )
}
