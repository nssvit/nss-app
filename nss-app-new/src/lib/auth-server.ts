import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-side auth check for use in page.tsx server components.
 * Redirects to /login if not authenticated.
 * Uses the same Supabase server client as auth-cache.
 */
export async function requireAuthServer() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user
}
