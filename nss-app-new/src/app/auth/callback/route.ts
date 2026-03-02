import { NextResponse } from 'next/server'

/**
 * Legacy auth callback route.
 * Better Auth handles callbacks via /api/auth/[...all].
 * This route redirects to dashboard for any old links that may still point here.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  return NextResponse.redirect(`${origin}${next}`)
}
