# Supabase Auth Setup Guide for Next.js (App Router)

A battle-tested guide for setting up robust cookie-based authentication with Supabase and Next.js App Router — covering every layer from middleware to client context, with specific pitfalls to avoid around caching, cookies, timeouts, and session persistence.

> Based on official Supabase docs, real production debugging, and lessons learned from deadlocks, stale sessions, and token refresh failures.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Package Setup](#2-package-setup)
3. [Environment Variables](#3-environment-variables)
4. [Supabase Client Creation](#4-supabase-client-creation)
5. [Middleware — Session Refresh](#5-middleware--session-refresh)
6. [Auth Context — Client-Side State](#6-auth-context--client-side-state)
7. [Server-Side Auth Checks](#7-server-side-auth-checks)
8. [Auth Callback Route (PKCE)](#8-auth-callback-route-pkce)
9. [Login & Signup Forms](#9-login--signup-forms)
10. [Auth Guard & Protected Routes](#10-auth-guard--protected-routes)
11. [getUser vs getClaims vs getSession](#11-getuser-vs-getclaims-vs-getsession)
12. [Common Pitfalls & How to Avoid Them](#12-common-pitfalls--how-to-avoid-them)
13. [Checklist](#13-checklist)

---

## 1. Architecture Overview

Supabase Auth with Next.js SSR uses **cookie-based sessions**. Tokens live in cookies shared between browser and server — not in `localStorage`.

```
Browser Request
    │
    ▼
┌──────────────────────────────────────────┐
│  Next.js Middleware (runs on EVERY route) │
│  • Reads auth cookies from request       │
│  • Calls getUser() to validate + refresh │
│  • Writes refreshed cookies to response  │
└──────────────────┬───────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
  Server Component       Client Component
  • requireAuthServer()  • AuthProvider
  • Uses getUser()       • Uses getSession()
  • Trusted, secure      • Fast, from cookies
  • For data fetching    • For UI state
```

**Key principle**: The middleware is the backbone. It refreshes tokens on every request. Without it, sessions expire silently.

---

## 2. Package Setup

```bash
npm install @supabase/supabase-js @supabase/ssr
```

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Core Supabase client (auth, database, storage) |
| `@supabase/ssr` | Cookie-based client factories for SSR frameworks |

> The older `@supabase/auth-helpers-nextjs` package is **deprecated**. Use `@supabase/ssr` instead.

---

## 3. Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
DATABASE_URL=postgresql://...  # For direct DB access (Drizzle, Prisma, etc.)
```

- `NEXT_PUBLIC_` prefix makes these available in browser code
- The **anon key** is safe to expose — it's restricted by Row Level Security (RLS)
- Never expose the **service_role key** in client code

---

## 4. Supabase Client Creation

You need **three** separate client factories — one for each execution context.

### 4a. Browser Client

**File**: `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- Used in client components (`'use client'`)
- Reads/writes cookies automatically via browser APIs
- Session persists across page navigations
- **Create once** per component tree (store in state or module scope)

### 4b. Server Client

**File**: `src/lib/supabase/server.ts`

```typescript
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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
            // Called from a Server Component (read-only context).
            // Safe to ignore — middleware handles cookie refresh.
          }
        },
      },
    }
  )
}
```

- Used in Server Components, Server Actions, and Route Handlers
- The `try/catch` in `setAll` is intentional — Server Components can't write cookies, but Server Actions and Route Handlers can
- The middleware ensures cookies are always fresh before Server Components run

### 4c. Middleware Client

Created inline inside the `updateSession` function (see next section). Uses `request.cookies` and `response.cookies` instead of Next.js `cookies()` API.

---

## 5. Middleware — Session Refresh

**This is the most critical piece.** Without proper middleware, sessions expire silently, cookies go stale, and users get logged out randomly.

### 5a. The `updateSession` Function

**File**: `src/lib/supabase/middleware.ts`

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/offline']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

export async function updateSession(request: NextRequest) {
  // 1. Create a response that passes the request through
  let supabaseResponse = NextResponse.next({ request })

  // 2. Create a Supabase client wired to request/response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update cookies on the request (for downstream Server Components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recreate the response with updated request
          supabaseResponse = NextResponse.next({ request })
          // Update cookies on the response (sent back to browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. IMPORTANT: Do NOT add logic between createServerClient and getUser().
  //    getUser() validates the JWT on the auth server AND refreshes expired
  //    tokens, writing updated cookies via the setAll callback above.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. Redirect unauthenticated users on protected routes only.
  //    Public routes still go through getUser() so cookies get refreshed.
  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 5. IMPORTANT: Return supabaseResponse, NOT NextResponse.next().
  //    supabaseResponse carries the refreshed cookies.
  return supabaseResponse
}
```

### 5b. The Middleware Entry Point

**File**: `src/middleware.ts`

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Always run updateSession — it refreshes auth cookies on ALL routes
  // (including /login, /signup) and only redirects on protected routes.
  return updateSession(request)
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
```

### Middleware Rules

| Rule | Why |
|------|-----|
| Run on ALL routes (including public) | Cookies must be refreshed even on `/login` — otherwise returning users get stale tokens |
| Call `getUser()` not `getSession()` | `getSession()` reads from cookies which can be spoofed. `getUser()` validates with the auth server |
| Don't add logic between `createServerClient` and `getUser()` | The client must be freshly created before calling auth methods |
| Return `supabaseResponse`, not `NextResponse.next()` | `supabaseResponse` carries the refreshed cookies |
| Don't skip `updateSession` for any route | Even if you don't need auth, cookies still need refreshing |

---

## 6. Auth Context — Client-Side State

The auth context manages client-side session state, user profile loading, and auth operations (sign in, sign out).

**File**: `src/contexts/auth-context.tsx`

### Critical Rules for `onAuthStateChange`

The Supabase docs contain explicit warnings about the `onAuthStateChange` callback:

> *"A callback can be an async function and it runs synchronously during the processing of the changes causing the event. You can easily create a dead-lock by using await on a call to another method of the Supabase library."*

**DO NOT** do this:

```typescript
// WRONG — causes deadlock
supabase.auth.onAuthStateChange(async (event, session) => {
  const { data } = await supabase.auth.getUser()  // DEADLOCK!
  const { data: profile } = await supabase.from('profiles').select()  // Risky
})
```

**DO** this instead:

```typescript
// CORRECT — dispatch work outside the callback
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION') return  // handled by getSession()

  if (session?.user) {
    // Use setTimeout to run after the callback completes
    setTimeout(() => {
      fetchUserProfile(session.user.id)  // your async function
    }, 0)
  }
})
```

### Recommended Auth Context Pattern

```typescript
'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

const AUTH_TIMEOUT_MS = 10000  // Safety net

export function AuthProvider({ children }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const lastFetchedUserIdRef = useRef<string | null>(null)

  // Fetches user profile from your DB.
  // Takes userId directly — never call supabase.auth.getUser() here.
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      setProfile(data)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // Safety timeout — prevents infinite loading on network issues
    const timeout = setTimeout(() => {
      if (loading) setLoading(false)
    }, AUTH_TIMEOUT_MS)

    // 1. Get initial session (fast, reads from cookies/storage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        lastFetchedUserIdRef.current = session.user.id
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 2. Listen for auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Skip INITIAL_SESSION — already handled by getSession() above
        if (event === 'INITIAL_SESSION') return

        // Handle sign-out
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
          lastFetchedUserIdRef.current = null
          setLoading(false)
          return
        }

        setSession(newSession)
        setUser(newSession?.user ?? null)

        // Only fetch profile when user actually changes
        if (newSession?.user && newSession.user.id !== lastFetchedUserIdRef.current) {
          lastFetchedUserIdRef.current = newSession.user.id
          // Dispatch via setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchProfile(newSession.user.id), 0)
        }
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  // ... signIn, signOut, context provider, etc.
}
```

### Key Patterns

| Pattern | Purpose |
|---------|---------|
| `getSession()` for initial load | Fast — reads from local storage, no network call |
| Skip `INITIAL_SESSION` event | Prevents double-fetch (both `getSession` and the event fire on mount) |
| `lastFetchedUserIdRef` | Prevents redundant profile fetches on `TOKEN_REFRESHED` and tab-refocus `SIGNED_IN` events |
| `setTimeout(0)` in callback | Avoids deadlock by dispatching work after the callback returns |
| Pass `userId` to fetch function | Avoids calling `supabase.auth.getUser()` inside the callback |
| Timeout safety net | Prevents infinite loading if network is down |
| Non-async callback | The `onAuthStateChange` callback itself is NOT async |

---

## 7. Server-Side Auth Checks

For protecting server components and server actions.

### 7a. Simple Auth Guard

**File**: `src/lib/auth-server.ts`

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireAuthServer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')
  return user
}
```

### 7b. Cached Auth (for multiple checks per request)

Use React's `cache()` to deduplicate auth calls within a single server request:

```typescript
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user
})
```

Now multiple server components or server actions in the same request share a single `getUser()` call.

### 7c. Usage in Server Components

```typescript
// src/app/(dashboard)/volunteers/page.tsx
import { requireAuthServer } from '@/lib/auth-server'

export default async function VolunteersPage() {
  await requireAuthServer()  // Redirects to /login if not authenticated
  const data = await fetchVolunteers()
  return <VolunteersList data={data} />
}
```

---

## 8. Auth Callback Route (PKCE)

Required for email confirmation links, OAuth redirects, and magic links.

**File**: `src/app/auth/callback/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- The `code` parameter comes from Supabase's PKCE flow
- `exchangeCodeForSession` converts the auth code into a session (access + refresh tokens)
- Tokens are stored in cookies via the server client's `setAll` callback

---

## 9. Login & Signup Forms

### Login

```typescript
'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const { signInWithEmail } = useAuth()
  const router = useRouter()

  async function onSubmit(email: string, password: string) {
    const { error } = await signInWithEmail(email, password)
    if (error) {
      // Show error to user
      return
    }
    // Navigate after sign-in completes
    router.push('/dashboard')
  }

  // ... form JSX
}
```

### Signup

```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      // User metadata — available in database triggers
      first_name: 'John',
      last_name: 'Doe',
    },
  },
})
```

- If **Confirm email** is enabled: returns `user` but `session` is null (user must verify email first)
- If **Confirm email** is disabled: returns both `user` and `session`
- User metadata in `options.data` is stored in `auth.users.raw_user_meta_data` and accessible in database triggers

---

## 10. Auth Guard & Protected Routes

### Client-Side Auth Guard

Wraps dashboard layouts to show loading state while auth resolves:

```typescript
'use client'

import { useAuth } from '@/contexts/auth-context'

export function AuthGuard({ children }) {
  const { loading, authError, currentUser, retryAuth } = useAuth()

  if (loading) return <LoadingSkeleton />

  if (authError && !currentUser) {
    return (
      <div>
        <p>{authError}</p>
        <button onClick={retryAuth}>Retry</button>
      </div>
    )
  }

  return children
}
```

### Redirect Authenticated Users Away from Auth Pages

Prevents logged-in users from seeing the login/signup pages:

```typescript
'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function RedirectIfAuthenticated({ children }) {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && currentUser) router.replace('/dashboard')
  }, [currentUser, loading, router])

  if (loading || currentUser) return null
  return children
}
```

---

## 11. `getUser` vs `getClaims` vs `getSession`

This is the most confusing part of Supabase Auth. Here's the definitive comparison:

| Method | Network Call? | Validates JWT? | Refreshes Tokens? | Trusted on Server? | Speed |
|--------|:------------:|:--------------:|:-----------------:|:-----------------:|:-----:|
| `getSession()` | No (reads storage) | No | Yes (background) | **No** | ~1ms |
| `getClaims()` | Usually no* | Yes (signature) | Yes | Partially** | ~5-50ms |
| `getUser()` | **Yes** (every time) | **Yes** (server) | Yes | **Yes** | ~100-500ms |

\* `getClaims()` caches the JWKS endpoint locally. First call may hit the network.
\** `getClaims()` validates the JWT signature but doesn't check if the session was revoked server-side.

### When to Use Each

| Context | Use | Why |
|---------|-----|-----|
| **Middleware** | `getUser()` | Must refresh cookies AND validate. Runs once per request, so the ~200ms cost is acceptable |
| **Server Components** | `getUser()` | Server-side = never trust cookies alone |
| **Server Actions** | `getUser()` | Same as above — always validate on server |
| **Client Components (initial load)** | `getSession()` | Fast, no network call. Middleware already refreshed the cookies |
| **Client Components (ongoing)** | `onAuthStateChange` | Listens for session changes reactively |

### Security Rule

> **Never trust `getSession()` on the server.** Cookies can be spoofed. Always use `getUser()` for server-side authorization decisions.

---

## 12. Common Pitfalls & How to Avoid Them

### Pitfall 1: Deadlock in `onAuthStateChange`

**Symptom**: Auth hangs forever, timeout fires, "Authentication is taking longer than expected."

**Cause**: Calling `await supabase.auth.getUser()` (or any Supabase auth method) inside an async `onAuthStateChange` callback. The auth state machine waits for the callback to return, but the callback is waiting for an auth method that needs the state machine.

**Fix**: Never call Supabase auth methods inside the callback. Use `setTimeout(0)`:

```typescript
// WRONG
onAuthStateChange(async (event, session) => {
  const user = await supabase.auth.getUser()  // DEADLOCK
})

// CORRECT
onAuthStateChange((event, session) => {
  setTimeout(() => {
    fetchProfile(session.user.id)  // Only DB queries, no auth calls
  }, 0)
})
```

---

### Pitfall 2: Double Fetch on Mount

**Symptom**: Profile is fetched twice on page load, causing unnecessary DB queries and potential race conditions.

**Cause**: Both `getSession()` and `onAuthStateChange(INITIAL_SESSION)` fire when there's an existing session, both triggering your profile fetch.

**Fix**: Skip `INITIAL_SESSION` in the listener:

```typescript
onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION') return  // Already handled by getSession()
  // ... handle other events
})
```

---

### Pitfall 3: Session Not Persisting / Stuck at Login

**Symptom**: User signs in successfully but gets redirected back to login on refresh. Session cookies appear missing.

**Cause**: Middleware not running on all routes, or middleware not calling an auth method that triggers cookie refresh.

**Fix**: Ensure middleware:
1. Runs on ALL routes (including public routes like `/login`, `/signup`)
2. Calls `getUser()` which triggers the `setAll` callback to write refreshed cookies
3. Returns `supabaseResponse` (not `NextResponse.next()`) — it carries the updated cookies

```typescript
// WRONG — skipping public routes
if (isPublicRoute(pathname)) return NextResponse.next()  // Cookies never refreshed!

// CORRECT — always call getUser, only redirect on protected routes
const { data: { user } } = await supabase.auth.getUser()
if (!user && !isPublicRoute(pathname)) {
  return NextResponse.redirect(loginUrl)
}
return supabaseResponse  // Always return this, even for public routes
```

---

### Pitfall 4: Redundant `getUser()` Calls

**Symptom**: Slow page loads. Each component/action independently calls `getUser()`, causing multiple network round trips.

**Fix for server-side**: Use React's `cache()`:

```typescript
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  return supabase.auth.getUser()
})
```

**Fix for client-side**: Pass the user ID from the session/event to your fetch function instead of calling `getUser()` again:

```typescript
// WRONG
async function fetchProfile() {
  const { data: { user } } = await supabase.auth.getUser()  // Redundant!
  const profile = await supabase.from('profiles').select().eq('user_id', user.id)
}

// CORRECT
async function fetchProfile(userId: string) {
  const profile = await supabase.from('profiles').select().eq('user_id', userId)
}
```

---

### Pitfall 5: `SIGNED_IN` Fires Too Often

**Symptom**: Profile is re-fetched every time the user switches tabs.

**Cause**: `SIGNED_IN` fires on every session confirmation, including tab refocus. The Supabase docs say: *"Emitted each time a user session is confirmed or re-established, including on user sign in and when refocusing a tab."*

**Fix**: Track the last fetched user ID and skip if unchanged:

```typescript
const lastFetchedUserIdRef = useRef<string | null>(null)

onAuthStateChange((event, session) => {
  if (session?.user && session.user.id !== lastFetchedUserIdRef.current) {
    lastFetchedUserIdRef.current = session.user.id
    setTimeout(() => fetchProfile(session.user.id), 0)
  }
})
```

---

### Pitfall 6: Stale `.next` Cache After Modifying Server Actions

**Symptom**: `UnrecognizedActionError — Server Action not found on server` after modifying action files.

**Cause**: The `.next` build cache has old server action IDs baked in.

**Fix**: Delete `.next` and rebuild:

```bash
rm -rf .next && npm run build
```

---

### Pitfall 7: Cookie Options — Don't Over-Restrict

**Symptom**: Cookies aren't sent on certain requests, auth fails intermittently.

**Cause**: Overly restrictive cookie settings.

**Rules from Supabase Advanced Guide**:
- **SameSite**: Use `Lax` (default). Don't use `Strict` — it blocks cookies on OAuth redirects
- **Max-Age/Expires**: Don't artificially shorten. These only control when the browser sends the cookie, not session validity
- **HttpOnly**: Not required. The browser needs access to the refresh token for background refresh
- **Secure**: Required for `SameSite=None`, but causes issues on `localhost` (HTTP). `Lax` works fine for localhost

---

### Pitfall 8: Route Prefetching Race Condition

**Symptom**: After sign-in, dashboard briefly shows unauthenticated state.

**Cause**: The Supabase Advanced Guide warns: *"Next.js route prefetching using `<Link>` components or `Router.push()` can send server requests before tokens are processed."*

**Fix**: This mainly affects `<Link>` prefetching, not programmatic `router.push()`. If you experience this:
- Use `router.replace()` instead of `router.push()` after login (also prevents back-button to login page)
- Or redirect through a server-side route that sets cookies first

---

## 13. Checklist

Use this checklist to verify your auth setup is complete and correct.

### Packages
- [ ] Using `@supabase/ssr` (not deprecated `@supabase/auth-helpers`)
- [ ] `@supabase/supabase-js` and `@supabase/ssr` are up to date

### Clients
- [ ] Browser client uses `createBrowserClient` from `@supabase/ssr`
- [ ] Server client uses `createServerClient` with `cookies()` from `next/headers`
- [ ] Server client has `try/catch` in `setAll` for Server Component context
- [ ] Middleware client uses `request.cookies` / `response.cookies`

### Middleware
- [ ] `updateSession()` runs on ALL routes (including public routes)
- [ ] Matcher excludes only static files (`_next/static`, `_next/image`, etc.)
- [ ] Calls `getUser()` (not `getSession()` or `getClaims()`)
- [ ] No logic between `createServerClient` and `getUser()`
- [ ] Returns `supabaseResponse` (not a new `NextResponse.next()`)
- [ ] Redirects only on protected routes (public routes still refresh cookies)

### Auth Context
- [ ] `onAuthStateChange` callback is NOT async
- [ ] No Supabase auth method calls (`getUser`, `getSession`) inside the callback
- [ ] Uses `setTimeout(0)` to dispatch async work from the callback
- [ ] Skips `INITIAL_SESSION` event (handled by `getSession()`)
- [ ] Tracks `lastFetchedUserId` to prevent redundant fetches
- [ ] Has a timeout safety net (10-15 seconds)
- [ ] `fetchProfile` function takes `userId` parameter (doesn't call `getUser()`)
- [ ] Properly clears state on `SIGNED_OUT`

### Server-Side
- [ ] Protected pages use `getUser()` (never `getSession()`)
- [ ] Auth checks are cached with `React.cache()` for per-request dedup
- [ ] Redirects to `/login` on auth failure

### Auth Callback
- [ ] Route at `/auth/callback` handles PKCE code exchange
- [ ] Uses `exchangeCodeForSession(code)`
- [ ] Redirects to `next` param or fallback (`/dashboard`)

### Auth Pages
- [ ] Login/signup pages redirect authenticated users away
- [ ] Sign-up includes user metadata in `options.data` if using DB triggers
- [ ] Error messages don't reveal whether an email exists (Supabase handles this)

---

## Quick Reference: Auth Method Decision Tree

```
Where are you running?
│
├─ Server (middleware, server component, server action, route handler)
│   │
│   ├─ Need to protect a route or authorize an action?
│   │   └─ Use getUser()  ← Always. Never trust getSession() on server.
│   │
│   └─ Already called getUser() in this request?
│       └─ Use React cache() to deduplicate
│
└─ Client (browser, React component)
    │
    ├─ Initial page load?
    │   └─ Use getSession()  ← Fast, reads from storage
    │
    ├─ Listening for auth changes?
    │   └─ Use onAuthStateChange()  ← Reactive, covers all events
    │
    └─ Need verified user identity?
        └─ Trust the middleware  ← It already validated with getUser()
```

---

*Last updated: February 2026. Based on `@supabase/ssr@0.8.0`, `@supabase/supabase-js@2.95.3`, Next.js 15.*
