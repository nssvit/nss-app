import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Next.js Middleware (2025 Best Practices)
 *
 * Purpose: Refresh auth tokens and pass them to Server Components
 * Security: Uses lightweight approach - actual auth checks happen at data access layer
 *
 * References:
 * - https://supabase.com/docs/guides/auth/server-side/nextjs
 * - https://www.franciscomoretti.com/blog/modern-nextjs-authentication-best-practices
 */

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    // Create Supabase client for cookie management
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

    // IMPORTANT: Refresh the auth token and validate JWT signature
    // Must use getClaims() NOT getSession() - getSession() doesn't revalidate!
    // Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
    await supabase.auth.getClaims()

    // getClaims() validates JWT against public keys - prevents cookie spoofing
    // This is the PRIMARY purpose of middleware - token refresh & validation

    return supabaseResponse
  } catch (error) {
    // Gracefully handle errors - allow request to proceed
    console.error('Middleware error:', error)
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, jpeg, gif, webp)
     * - API routes (handled separately)
     *
     * This matcher optimizes performance by skipping unnecessary middleware runs
     * Reference: https://nextjs.org/docs/app/building-your-application/routing/middleware
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
