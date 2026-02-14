import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Always run updateSession — it refreshes auth cookies on ALL routes
  // (including /login, /signup) and only redirects on protected routes.
  return updateSession(request)
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and manifest
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
