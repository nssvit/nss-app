import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Component Supabase Client
 *
 * Use this in Client Components (components with 'use client' directive)
 * This creates a singleton browser client for use in the browser.
 *
 * Note: We use Drizzle ORM for database queries, so Supabase client
 * is primarily used for authentication.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
