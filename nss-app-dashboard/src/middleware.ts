import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/**
 * Next.js Middleware (2025 Best Practices)
 *
 * Purpose:
 * 1. Refresh auth tokens and pass them to Server Components
 * 2. Redirect unauthenticated users to login
 * 3. Handle role-based route access (actual role checks in components)
 *
 * Security: Uses lightweight approach - actual auth checks happen at data access layer
 * Role validation is done in components using ProtectedRoute for full security
 *
 * References:
 * - https://supabase.com/docs/guides/auth/server-side/nextjs
 * - https://www.franciscomoretti.com/blog/modern-nextjs-authentication-best-practices
 */

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback']

// Check if a route is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Update session (handles token refresh)
  const response = await updateSession(request)

  return response
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
