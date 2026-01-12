import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Middleware Supabase Client Helper
 *
 * Creates a Supabase client configured for use in Next.js middleware.
 * This is responsible for:
 * 1. Refreshing the Auth token by calling supabase.auth.getClaims()
 * 2. Passing the refreshed token to Server Components via request.cookies.set
 * 3. Passing the refreshed token to the browser via response.cookies.set
 *
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: Use getClaims() NOT getSession()
  // getClaims() validates the JWT signature against the project's published public keys
  // This prevents cookie spoofing attacks
  await supabase.auth.getClaims()

  return supabaseResponse
}
