'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/dashboard')
    }
  }, [currentUser, loading, router])

  if (loading) return null
  if (currentUser) return null

  return <>{children}</>
}
