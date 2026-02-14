import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Server Component Supabase Client
 *
 * Use this in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 *
 * IMPORTANT: This creates a new client for each request.
 * The cookies handling allows the server to read/write the user session.
 *
 * Note: We use Drizzle ORM for database queries, so Supabase client
 * is primarily used for authentication.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
