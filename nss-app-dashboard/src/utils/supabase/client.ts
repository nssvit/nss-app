import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

/**
 * Client Component Supabase Client
 *
 * Use this in Client Components (components with 'use client' directive)
 * This creates a singleton browser client for use in the browser.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
