'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/dashboard')
    }
  }, [currentUser, loading, router])

  // Show a spinner while auth state is being determined.
  // Once resolved, always render children — the useEffect above
  // handles the redirect so the page never goes blank.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
