import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/offline', '/forgot-password', '/reset-password']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  // getUser() validates the JWT on the auth server AND refreshes expired tokens,
  // writing updated cookies to supabaseResponse via the setAll callback above.
  // We use getUser() over getClaims() because it verifies the session is still
  // valid server-side (catches revoked sessions that local JWT validation misses).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Only redirect unauthenticated users on protected routes.
  // Public routes still go through getUser() above so cookies get refreshed.
  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
