import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/offline']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Refresh session and check auth
  return updateSession(request)
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and manifest
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
