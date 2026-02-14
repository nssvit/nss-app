'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthForm } from '@/components/auth'
import { useAuth } from '@/contexts/AuthContext'

export default function SignupPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #070709 0%, #0c0c0e 50%, #131315 100%)',
        }}
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    )
  }

  return <AuthForm mode="signup" onToggleMode={() => router.push('/login')} />
}
