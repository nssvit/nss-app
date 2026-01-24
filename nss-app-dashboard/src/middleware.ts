import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

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
  return await updateSession(request)
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
