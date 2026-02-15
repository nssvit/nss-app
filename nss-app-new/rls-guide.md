# NSS App - Row Level Security (RLS) Guide

**For:** Any developer maintaining or extending this project's database security layer.
**Stack:** Next.js 15 + Supabase (PostgreSQL) + Drizzle ORM + RLS Policies

---

## Table of Contents

1. [What is RLS and Why We Use It](#1-what-is-rls-and-why-we-use-it)
2. [Our Two-Path Data Access Architecture](#2-our-two-path-data-access-architecture)
3. [How We Designed the Policies](#3-how-we-designed-the-policies)
4. [RLS Helper Functions](#4-rls-helper-functions)
5. [Complete Policy Reference (25 Policies, 6 Tables)](#5-complete-policy-reference-25-policies-6-tables)
6. [SECURITY DEFINER Functions (Bypass RLS)](#6-security-definer-functions-bypass-rls)
7. [Server Action to Policy Mapping](#7-server-action-to-policy-mapping)
8. [Edge Cases and Why They Don't Break](#8-edge-cases-and-why-they-dont-break)
9. [Safety Verification — Proof Nothing Breaks](#9-safety-verification--proof-nothing-breaks)
10. [Migration History](#10-migration-history)
11. [How to Add New Tables or Policies](#11-how-to-add-new-tables-or-policies)
12. [How to Debug RLS Issues](#12-how-to-debug-rls-issues)
13. [PostgreSQL RLS Concepts Reference](#13-postgresql-rls-concepts-reference)
14. [FAQ](#14-faq)

---

## 1. What is RLS and Why We Use It

### What is Row Level Security?

Row Level Security (RLS) is a PostgreSQL feature that lets you control **which rows** a user can see or modify, at the database level. When RLS is enabled on a table, every query is filtered through policies — even if the SQL itself has no WHERE clause.

```
Without RLS:  SELECT * FROM volunteers  →  returns ALL rows
With RLS:     SELECT * FROM volunteers  →  returns only rows the policy allows
```

### Why We Use It (Defense-in-Depth)

Our app has **two layers of access control**:

| Layer | Where | How | Purpose |
|-------|-------|-----|---------|
| **Layer 1: Application Code** | Server Actions (`src/app/actions/*`) | `requireAdmin()`, `requireAnyRole()`, `getAuthUser()` | Primary authorization — controls all data access |
| **Layer 2: RLS Policies** | PostgreSQL database | SQL policies on each table | Defense-in-depth — protects against direct database access |

**Layer 1 is the primary guard.** Every server action checks the user's role before executing any query. RLS is the backup.

**Layer 2 (RLS) protects against:**
- Someone using the Supabase **anon key** directly (e.g., via Postman, curl, or a custom client)
- A bug in server action code that accidentally skips auth checks
- Any client-side code that queries Supabase directly instead of using server actions

**RLS does NOT affect our server actions** — they use Drizzle ORM with `DATABASE_URL` (postgres role credentials), which bypasses RLS entirely. This is by design.

---

## 2. Our Two-Path Data Access Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  auth-context.tsx ──→ Supabase JS Client (anon key + JWT)      │
│    1. SELECT volunteers WHERE auth_user_id = me                │
│    2. SELECT user_roles WHERE volunteer_id = me                │
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │  RLS IS ENFORCED on these 2 queries │                      │
│  │  Both are SELECT with policy: true  │                      │
│  │  → No behavior change from RLS      │                      │
│  └──────────────────────────────────────┘                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ Server Action call
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Next.js Node.js)                    │
│                                                                 │
│  Server Action (e.g., createEvent)                             │
│    1. await requireAnyRole('admin', 'head')  ← auth check     │
│    2. await db.insert(events).values(...)    ← Drizzle query  │
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │  RLS IS BYPASSED (Drizzle uses      │                      │
│  │  DATABASE_URL = postgres role)       │                      │
│  │  → Auth enforced in app code only   │                      │
│  └──────────────────────────────────────┘                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
│                                                                 │
│  Tables with RLS enabled:                                      │
│    volunteers, user_roles, role_definitions,                   │
│    events, event_categories, event_participation               │
│                                                                 │
│  SECURITY DEFINER functions (bypass RLS):                      │
│    handle_new_user(), merge_volunteers(), is_admin(), etc.     │
└─────────────────────────────────────────────────────────────────┘
```

### Path 1: Supabase JS Client (RLS Enforced)

- **Connection:** `src/lib/supabase/client.ts` — uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Where used:** `src/contexts/auth-context.tsx` (2 SELECT queries only)
- **RLS applies:** Yes — every query is filtered by policies
- **Our SELECT policies are all `true`** — so these 2 queries work exactly as before

### Path 2: Drizzle ORM (RLS Bypassed)

- **Connection:** `src/db/index.ts` — uses `DATABASE_URL` (postgres role credentials)
- **Where used:** ALL server actions, ALL query modules (`src/db/queries/*`)
- **RLS applies:** No — postgres role bypasses RLS entirely
- **Auth is enforced in application code** (`requireAdmin()`, `requireAnyRole()`, etc.)

### Key Insight

Since **every single data mutation** (INSERT, UPDATE, DELETE) in our app goes through Drizzle (Path 2), the restrictive RLS policies on writes are purely a safety net. They can never break the app because the app never hits the code path they restrict.

---

## 3. How We Designed the Policies

### Design Principle: Mirror the Server Action Auth Gates

Every RLS policy was designed by looking at the corresponding server action and copying its authorization rule:

```
Server Action                          →  RLS Policy
─────────────────────────────────────────────────────────────
createEvent() → requireAnyRole('admin','head')  →  events INSERT: is_admin_or_head()
updateVolunteer() → requireAdmin()              →  volunteers UPDATE: is_admin()
registerForEvent() → getCurrentVolunteer()      →  participation INSERT: volunteer_id = self
syncAttendance() deletes via Drizzle            →  participation DELETE: false (Drizzle bypasses)
```

### Design Rules We Followed

1. **All SELECT policies are `true`** — Every authenticated user can read all data. This matches our app where all reads only require `getAuthUser()` (any logged-in user).

2. **All DELETE policies are `false`** — The app exclusively uses soft-delete (`is_active = false`). No table ever has rows hard-deleted via Supabase client. The only hard deletes happen through:
   - `syncAttendance()` — via Drizzle (bypasses RLS)
   - `merge_volunteers()` — SECURITY DEFINER function (bypasses RLS)

3. **INSERT/UPDATE policies match the server action's `require*()` call:**
   - `requireAdmin()` → `is_admin()`
   - `requireAnyRole('admin', 'head')` → `is_admin_or_head()`
   - `getCurrentVolunteer()` (self-service) → `volunteer_id = get_current_volunteer_id()`

4. **Policies target `TO authenticated` only** — No `anon` policies exist. Unauthenticated users see zero rows.

5. **All policies are PERMISSIVE** (PostgreSQL default) — When multiple permissive policies exist for the same operation, PostgreSQL ORs them together. This is how `event_participation` has two INSERT policies (self + admin/head).

---

## 4. RLS Helper Functions

These SQL functions are used inside RLS policies. All are `SECURITY DEFINER` — they execute with the function owner's privileges (postgres), bypassing RLS on the tables they query internally. This prevents infinite recursion (a policy on `volunteers` calling a function that queries `volunteers`).

### `is_admin(p_user_id UUID DEFAULT auth.uid())`

```sql
-- Returns TRUE if the user has an active, non-expired 'admin' role
-- Defined in: 0001_setup.sql, updated in 0004_rls_policies.sql
-- SECURITY DEFINER: bypasses RLS on volunteers, user_roles, role_definitions

SELECT EXISTS (
  SELECT 1
  FROM volunteers v
  JOIN user_roles ur ON ur.volunteer_id = v.id
  JOIN role_definitions rd ON rd.id = ur.role_definition_id
  WHERE v.auth_user_id = p_user_id
    AND rd.role_name = 'admin'
    AND ur.is_active = true
    AND v.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())  -- added in 0004
);
```

**Used in policies for:** volunteers UPDATE, user_roles INSERT/UPDATE, role_definitions INSERT/UPDATE, event_categories INSERT/UPDATE

### `has_role(p_role_name TEXT, p_user_id UUID DEFAULT auth.uid())`

```sql
-- Returns TRUE if the user has a specific active, non-expired role
-- Same as is_admin() but with parameterized role_name
-- SECURITY DEFINER: bypasses RLS
```

**Used for:** General role checks (not directly in current policies, but available)

### `is_admin_or_head(p_user_id UUID DEFAULT auth.uid())`

```sql
-- Returns TRUE if the user has either 'admin' OR 'head' role (active, non-expired)
-- Added in: 0004_rls_policies.sql
-- SECURITY DEFINER: bypasses RLS
-- Optimization: single 3-table JOIN instead of calling is_admin() + has_role('head') separately

SELECT EXISTS (
  SELECT 1
  FROM volunteers v
  JOIN user_roles ur ON ur.volunteer_id = v.id
  JOIN role_definitions rd ON rd.id = ur.role_definition_id
  WHERE v.auth_user_id = p_user_id
    AND rd.role_name IN ('admin', 'head')
    AND ur.is_active = true
    AND v.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
);
```

**Used in policies for:** events INSERT/UPDATE, event_participation INSERT (admin), event_participation UPDATE

### `get_current_volunteer_id()`

```sql
-- Returns the volunteer.id for the currently authenticated user
-- Defined in: 0001_setup.sql (unchanged)
-- SECURITY DEFINER: bypasses RLS on volunteers

SELECT id FROM volunteers WHERE auth_user_id = auth.uid() LIMIT 1;
```

**Used in policies for:** event_participation INSERT (self-registration)

### Why `expires_at` Was Added (0004 Fix)

The original `is_admin()` and `has_role()` in `0001_setup.sql` only checked `ur.is_active = true` but NOT `expires_at`. However, the application code in `src/db/queries/roles.ts:11-14` checks both:

```typescript
const roleIsActiveAndNotExpired = and(
  eq(userRoles.isActive, true),
  or(isNull(userRoles.expiresAt), sql`${userRoles.expiresAt} > NOW()`)
)
```

Migration `0004_rls_policies.sql` fixed this mismatch by adding `AND (ur.expires_at IS NULL OR ur.expires_at > NOW())` to all helper functions.

---

## 5. Complete Policy Reference (25 Policies, 6 Tables)

### volunteers (4 policies)

| Policy Name | Operation | Condition (USING/WITH CHECK) | Why |
|---|---|---|---|
| `volunteers_select` | SELECT | `true` | All logged-in users can read volunteer data. `auth-context.tsx` fetches own profile via Supabase client. |
| `volunteers_insert` | INSERT | `false` | Volunteers are ONLY created by the `handle_new_user()` trigger (SECURITY DEFINER), which fires on Supabase Auth signup. No client should ever INSERT directly. |
| `volunteers_update` | UPDATE | `auth_user_id = auth.uid() OR is_admin()` | Volunteers can update their own profile. Admins can update any volunteer. Matches `updateMyProfile()` and `updateVolunteer()`. |
| `volunteers_delete` | DELETE | `false` | App uses soft-delete (`is_active = false`). Hard deletes only via `merge_volunteers()` (SECURITY DEFINER). |

### user_roles (4 policies)

| Policy Name | Operation | Condition | Why |
|---|---|---|---|
| `user_roles_select` | SELECT | `true` | `auth-context.tsx` fetches current user's roles via Supabase client. Role checks happen everywhere. |
| `user_roles_insert` | INSERT | `is_admin()` | Only admins can assign roles. Matches `assignRole()` → `requireAdmin()`. |
| `user_roles_update` | UPDATE | `is_admin()` | Only admins can revoke roles (sets `is_active = false`). Matches `revokeRole()` → `requireAdmin()`. |
| `user_roles_delete` | DELETE | `false` | App uses soft-delete. Signup trigger (SECURITY DEFINER) also inserts roles. |

### role_definitions (4 policies)

| Policy Name | Operation | Condition | Why |
|---|---|---|---|
| `role_definitions_select` | SELECT | `true` | Role dropdowns, auth checks — everyone reads. |
| `role_definitions_insert` | INSERT | `is_admin()` | Only admins create new role types. Matches `createRoleDefinition()` → `requireAdmin()`. |
| `role_definitions_update` | UPDATE | `is_admin()` | Only admins edit role definitions. Matches `updateRoleDefinition()` → `requireAdmin()`. |
| `role_definitions_delete` | DELETE | `false` | No hard deletes in the app. |

### events (4 policies)

| Policy Name | Operation | Condition | Why |
|---|---|---|---|
| `events_select` | SELECT | `true` | All users browse events. |
| `events_insert` | INSERT | `is_admin_or_head()` | Admins and heads create events. Matches `createEvent()` → `requireAnyRole('admin', 'head')`. |
| `events_update` | UPDATE | `is_admin_or_head()` | Admins and heads edit/soft-delete events. Matches `updateEvent()` / `deleteEvent()`. |
| `events_delete` | DELETE | `false` | Soft-delete only (`is_active = false`). |

### event_categories (4 policies)

| Policy Name | Operation | Condition | Why |
|---|---|---|---|
| `event_categories_select` | SELECT | `true` | Category dropdowns, filters — everyone reads. |
| `event_categories_insert` | INSERT | `is_admin()` | Only admins create categories. Matches `createCategory()` → `requireAdmin()`. |
| `event_categories_update` | UPDATE | `is_admin()` | Only admins edit categories. Matches `updateCategory()` → `requireAdmin()`. |
| `event_categories_delete` | DELETE | `false` | Soft-delete only. |

### event_participation (5 policies)

| Policy Name | Operation | Condition | Why |
|---|---|---|---|
| `event_participation_select` | SELECT | `true` | Attendance records, participation history — everyone reads. |
| `event_participation_insert_self` | INSERT | `volunteer_id = get_current_volunteer_id()` | Volunteers can register **themselves** for events. Matches `registerForEvent()` → `getCurrentVolunteer()`. |
| `event_participation_insert_admin` | INSERT | `is_admin_or_head()` | Admins/heads can register **any volunteer**. Matches `addVolunteersToEvent()` → `requireAnyRole('admin', 'head')`. |
| `event_participation_update` | UPDATE | `is_admin_or_head()` | Attendance marking, hours approval. Matches `markAttendance()`, `bulkApproveHours()`, etc. |
| `event_participation_delete` | DELETE | `false` | `syncAttendance()` DELETEs via Drizzle (bypasses RLS). No client-side deletes. |

**Important — Two INSERT Policies on event_participation:**
PostgreSQL ORs all permissive policies for the same operation on the same table. So for an INSERT:
- If `volunteer_id = get_current_volunteer_id()` → allowed (self-register)
- **OR** if `is_admin_or_head()` → allowed (admin/head registering anyone)
- If neither matches → blocked

---

## 6. SECURITY DEFINER Functions (Bypass RLS)

SECURITY DEFINER functions run with the **function owner's** privileges (postgres role), not the calling user's. They bypass all RLS policies.

| Function | Defined In | Triggered By | What It Does | Tables It Modifies |
|---|---|---|---|---|
| `handle_new_user()` | 0001, updated in 0003 | `AFTER INSERT ON auth.users` | Creates volunteer record, auto-links CSV imports, assigns default 'volunteer' role | INSERT `volunteers`, INSERT `user_roles` |
| `handle_auth_user_deleted()` | 0001 | `BEFORE DELETE ON auth.users` | Soft-deletes volunteer and deactivates all roles | UPDATE `volunteers`, UPDATE `user_roles` |
| `merge_volunteers(keep, remove)` | 0003 | Called via `db.execute()` from server action | Transfers participation/roles from CSV volunteer to auth volunteer, then hard-deletes source | UPDATE/DELETE `event_participation`, UPDATE/DELETE `user_roles`, UPDATE `events`, DELETE `volunteers` |
| `is_admin()` | 0001, updated in 0004 | Used inside RLS policies | Checks if user has active admin role | SELECT `volunteers`, `user_roles`, `role_definitions` |
| `has_role()` | 0001, updated in 0004 | Used inside RLS policies | Checks if user has specific active role | SELECT `volunteers`, `user_roles`, `role_definitions` |
| `is_admin_or_head()` | 0004 | Used inside RLS policies | Checks if user has admin or head role | SELECT `volunteers`, `user_roles`, `role_definitions` |
| `get_current_volunteer_id()` | 0001 | Used inside RLS policies | Gets volunteer.id for current JWT user | SELECT `volunteers` |
| `trigger_set_updated_at()` | 0001 | `BEFORE UPDATE` on all tables | Auto-sets `updated_at = NOW()` | Modifies `NEW` record in-place |

### Why SECURITY DEFINER Matters

Without SECURITY DEFINER, these functions would be subject to the same RLS policies they help enforce. This creates problems:

1. **Infinite recursion:** A policy on `volunteers` calls `is_admin()`, which queries `volunteers`, which triggers the policy, which calls `is_admin()`... forever.
2. **Blocked triggers:** `handle_new_user()` needs to INSERT into `volunteers` (policy: `false`) and `user_roles` (policy: `is_admin()`). Without SECURITY DEFINER, signup would fail because the new user isn't an admin.
3. **Blocked merges:** `merge_volunteers()` needs to DELETE from `volunteers` (policy: `false`). Without SECURITY DEFINER, merging would be impossible.

SECURITY DEFINER solves all of these by running the function as the postgres role, which has full access regardless of RLS.

---

## 7. Server Action to Policy Mapping

This table shows every server action, its auth gate, its query method, and whether RLS applies.

### Volunteer Actions (`src/app/actions/volunteers.ts`)

| Server Action | Auth Gate | Query Method | RLS Applies? | Matching RLS Policy |
|---|---|---|---|---|
| `getVolunteers()` | `getAuthUser()` | Drizzle | No | `volunteers_select` (true) |
| `getVolunteerById()` | `getAuthUser()` | Drizzle | No | — |
| `getCurrentVolunteer()` | cached auth | Drizzle | No | — |
| `updateMyProfile()` | `getCachedVolunteer()` | Drizzle | No | `volunteers_update` (self OR admin) |
| `updateVolunteer()` | `requireAdmin()` | Drizzle | No | `volunteers_update` (admin) |
| `getUnlinkedVolunteers()` | `requireAdmin()` | Drizzle | No | — |
| `mergeVolunteers()` | `requireAdmin()` | `db.execute()` → PG function | No | — (SECURITY DEFINER) |

### Event Actions (`src/app/actions/events.ts`)

| Server Action | Auth Gate | Query Method | RLS Applies? | Matching RLS Policy |
|---|---|---|---|---|
| `getEvents()` | `getAuthUser()` | Drizzle | No | `events_select` (true) |
| `createEvent()` | `requireAnyRole('admin','head')` | Drizzle | No | `events_insert` (is_admin_or_head) |
| `updateEvent()` | `requireAnyRole('admin','head')` | Drizzle | No | `events_update` (is_admin_or_head) |
| `deleteEvent()` | `requireAnyRole('admin','head')` | Drizzle | No | `events_update` (soft-delete) |
| `registerForEvent()` | `getCurrentVolunteer()` | Drizzle | No | `participation_insert_self` |
| `addVolunteersToEvent()` | `requireAnyRole('admin','head')` | Drizzle | No | `participation_insert_admin` |

### Attendance Actions (`src/app/actions/attendance.ts`)

| Server Action | Auth Gate | Query Method | RLS Applies? | Matching RLS Policy |
|---|---|---|---|---|
| `markAttendance()` | `requireAnyRole('admin','head')` | Drizzle | No | `participation_update` |
| `syncAttendance()` | `requireAnyRole('admin','head')` | Drizzle (DELETE + INSERT) | No | `participation_delete` (false) — bypassed |
| `bulkMarkAttendance()` | `requireAnyRole('admin','head')` | Drizzle | No | `participation_update` |

### Hours Actions (`src/app/actions/hours.ts`)

| Server Action | Auth Gate | Query Method | RLS Applies? | Matching RLS Policy |
|---|---|---|---|---|
| `approveHours()` | `requireAnyRole('admin','head')` | Drizzle | No | `participation_update` |
| `bulkApproveHours()` | `requireAnyRole('admin','head')` | Drizzle | No | `participation_update` |
| `rejectHours()` | `requireAnyRole('admin','head')` | Drizzle | No | `participation_update` |

### Role Actions (`src/app/actions/roles.ts`)

| Server Action | Auth Gate | Query Method | RLS Applies? | Matching RLS Policy |
|---|---|---|---|---|
| `getRoles()` | `getAuthUser()` | Drizzle | No | `role_definitions_select` (true) |
| `assignRole()` | `requireAdmin()` | Drizzle | No | `user_roles_insert` (is_admin) |
| `revokeRole()` | `requireAdmin()` | Drizzle | No | `user_roles_update` (is_admin) |
| `createRoleDefinition()` | `requireAdmin()` | Drizzle | No | `role_definitions_insert` (is_admin) |

### Report Actions (`src/app/actions/reports.ts`)

| Server Action | Auth Gate | Query Method | RLS Applies? | Matching RLS Policy |
|---|---|---|---|---|
| `exportCSVData()` | `requireAdmin()` | `db.execute(sql...)` | No | — |
| `exportXLSXData()` | `requireAdmin()` | `db.execute(sql...)` | No | — |

### Category Actions (`src/app/actions/categories.ts`)

| Server Action | Auth Gate | Query Method | RLS Applies? | Matching RLS Policy |
|---|---|---|---|---|
| `getCategories()` | `getAuthUser()` | Drizzle | No | `event_categories_select` (true) |
| `createCategory()` | `requireAdmin()` | Drizzle | No | `event_categories_insert` (is_admin) |
| `updateCategory()` | `requireAdmin()` | Drizzle | No | `event_categories_update` (is_admin) |

---

## 8. Edge Cases and Why They Don't Break

### 1. Infinite Recursion Prevention

**Problem:** An RLS policy on `volunteers` calls `is_admin()`, which queries `volunteers`, which triggers the policy again...

**Solution:** `is_admin()`, `has_role()`, `is_admin_or_head()`, and `get_current_volunteer_id()` are all `SECURITY DEFINER`. They run as postgres role, bypassing RLS entirely. No recursion.

### 2. User Signup Flow

**Problem:** When a new user signs up, `handle_new_user()` needs to:
- INSERT into `volunteers` (policy: `false`)
- INSERT into `user_roles` (policy: `is_admin()`) — new user isn't an admin!

**Solution:** `handle_new_user()` is `SECURITY DEFINER` and is granted to `supabase_auth_admin`. It bypasses all RLS policies.

### 3. User Deletion Flow

**Problem:** When an auth user is deleted, `handle_auth_user_deleted()` needs to UPDATE `volunteers` and `user_roles`.

**Solution:** `handle_auth_user_deleted()` is `SECURITY DEFINER`. It bypasses RLS.

### 4. Volunteer Merge (CSV Import Linking)

**Problem:** `merge_volunteers()` needs to DELETE from `event_participation`, `user_roles`, and `volunteers` — all have DELETE policy `false`.

**Solution:** `merge_volunteers()` is `SECURITY DEFINER`. Called via `db.execute()` (Drizzle, also bypasses RLS). Double bypass.

### 5. syncAttendance Deletes

**Problem:** `syncAttendance()` in `src/app/actions/attendance.ts` DELETEs rows from `event_participation`. Policy says `false`.

**Solution:** `syncAttendance()` uses Drizzle (`db.transaction()`), which bypasses RLS via `DATABASE_URL`. The `false` policy only blocks Supabase client deletes.

### 6. CSV-Imported Volunteers (No Auth Account)

**Problem:** Volunteers imported from CSV have `auth_user_id = NULL`. Can they be affected by the UPDATE policy `auth_user_id = auth.uid() OR is_admin()`?

**Solution:** These volunteers have no Supabase auth account, so they can never authenticate via Supabase client. They can only be updated via Drizzle (admin server actions), which bypasses RLS. The policy is irrelevant for them.

### 7. Unauthenticated Users

**Problem:** What if someone accesses the API without logging in?

**Solution:** All policies target `TO authenticated`. Users with the `anon` role (unauthenticated) have zero policies — they see nothing. Supabase's anon key without a valid JWT returns zero rows.

### 8. Multiple INSERT Policies (event_participation)

**Problem:** `event_participation` has TWO INSERT policies: `_insert_self` and `_insert_admin`. How does PostgreSQL handle this?

**Solution:** PostgreSQL ORs all **permissive** policies for the same operation. A row is allowed if it matches ANY permissive policy. So:
- A regular volunteer inserting their own participation → matches `_insert_self` → allowed
- An admin inserting any volunteer's participation → matches `_insert_admin` → allowed
- A regular volunteer trying to insert someone else's participation → matches neither → blocked

---

## 9. Safety Verification — Proof Nothing Breaks

### Client-Side Queries (RLS Enforced)

Only **2 queries** in the entire app use Supabase client for data (both in `src/contexts/auth-context.tsx`):

| Query | Table | Operation | RLS Policy | Result |
|---|---|---|---|---|
| Fetch own profile | `volunteers` | SELECT | `true` | Works — all authenticated can read |
| Fetch own roles | `user_roles` + `role_definitions` | SELECT | `true` / `true` | Works — all authenticated can read |

Both are SELECT-only with `true` policies. **Zero behavior change.**

### Server-Side Queries (RLS Bypassed)

Every server action uses Drizzle ORM (`src/db/index.ts`), which connects via `DATABASE_URL` with postgres role credentials. **RLS is completely bypassed.** Verified by:

- `src/db/index.ts` line 11: *"This Drizzle connection bypasses RLS, so authorization must be handled in application code."*
- Connection uses `postgres(process.env.DATABASE_URL, ...)` — not Supabase client
- No server action imports or uses `@supabase/supabase-js` for data queries

### SECURITY DEFINER Functions (RLS Bypassed)

All 8 SECURITY DEFINER functions bypass RLS by definition. Verified each one:
- `handle_new_user()` — INSERT volunteers + user_roles → bypasses `false` and `is_admin()` policies
- `merge_volunteers()` — DELETE from volunteers, user_roles, event_participation → bypasses `false` policies
- `is_admin()`, `has_role()`, `is_admin_or_head()`, `get_current_volunteer_id()` — SELECT from multiple tables → bypasses RLS, prevents infinite recursion

### No Supabase Client Mutations

Grep confirmed: **zero** Supabase JS client INSERT/UPDATE/DELETE calls exist in the codebase. The restrictive write policies are purely a safety net.

---

## 10. Migration History

| Migration | File | What Changed |
|---|---|---|
| **0001_setup.sql** | `src/db/migrations/0001_setup.sql` | Initial RLS: enabled RLS on all 6 tables, created 18 permissive placeholder policies (all `true`), created `is_admin()`, `has_role()`, `get_current_volunteer_id()` helper functions |
| **0004_rls_policies.sql** | `src/db/migrations/0004_rls_policies.sql` | Tightened RLS: fixed `is_admin()` and `has_role()` to check `expires_at`, added `is_admin_or_head()`, dropped all 18 old policies, created 25 new policies with proper restrictions |

### What Changed Between 0001 and 0004

| Aspect | 0001 (Original) | 0004 (Tightened) |
|---|---|---|
| Policy count | 18 | 25 |
| SELECT policies | `true` (all tables) | `true` (all tables) — unchanged |
| INSERT policies | `true` (all tables) | Restricted by role or `false` |
| UPDATE policies | `true` (all tables) | Restricted by role |
| DELETE policies | `true` (all tables) | `false` (all tables) |
| `is_admin()` | Missing `expires_at` check | Added `expires_at` check |
| `has_role()` | Missing `expires_at` check | Added `expires_at` check |
| `is_admin_or_head()` | Did not exist | New convenience function |
| event_participation INSERT | 1 policy (true) | 2 policies (self + admin/head) |

---

## 11. How to Add New Tables or Policies

### Adding a New Table

When you create a new table, follow this checklist:

1. **Enable RLS** in the migration:
   ```sql
   ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
   ```

2. **Add policies** matching the server action auth pattern:
   ```sql
   -- SELECT: who can read?
   CREATE POLICY "new_table_select"
     ON public.new_table FOR SELECT
     TO authenticated
     USING (true);  -- or more restrictive

   -- INSERT: who can create?
   CREATE POLICY "new_table_insert"
     ON public.new_table FOR INSERT
     TO authenticated
     WITH CHECK (is_admin());  -- match your requireAdmin() / requireAnyRole()

   -- UPDATE: who can edit?
   CREATE POLICY "new_table_update"
     ON public.new_table FOR UPDATE
     TO authenticated
     USING (is_admin())
     WITH CHECK (is_admin());

   -- DELETE: blocked (use soft-delete)
   CREATE POLICY "new_table_delete"
     ON public.new_table FOR DELETE
     TO authenticated
     USING (false);
   ```

3. **Add the `updated_at` trigger** if the table has an `updated_at` column:
   ```sql
   CREATE TRIGGER set_updated_at
     BEFORE UPDATE ON public.new_table
     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
   ```

### Modifying an Existing Policy

1. Create a new migration file: `src/db/migrations/NNNN_description.sql`
2. Drop the old policy and create the new one:
   ```sql
   DROP POLICY IF EXISTS "old_policy_name" ON public.table_name;
   CREATE POLICY "new_policy_name"
     ON public.table_name FOR <operation>
     TO authenticated
     USING (<condition>);
   ```
3. Run `npm run db:migrate`

### Adding a New Role

If you add a new role (e.g., `secretary`) and need it in RLS policies:

1. Insert the role definition (via server action or migration)
2. If the role needs its own policy level, either:
   - Add the role to `is_admin_or_head()` → becomes `is_admin_or_head_or_secretary()`
   - Or create a new helper function:
     ```sql
     CREATE OR REPLACE FUNCTION public.has_any_staff_role(p_user_id UUID DEFAULT auth.uid())
     RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
       SELECT EXISTS (
         SELECT 1 FROM volunteers v
         JOIN user_roles ur ON ur.volunteer_id = v.id
         JOIN role_definitions rd ON rd.id = ur.role_definition_id
         WHERE v.auth_user_id = p_user_id
           AND rd.role_name IN ('admin', 'head', 'secretary')
           AND ur.is_active = true AND v.is_active = true
           AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
       );
     $$;
     GRANT EXECUTE ON FUNCTION public.has_any_staff_role(UUID) TO authenticated;
     ```
3. Update the relevant policies to use the new function

---

## 12. How to Debug RLS Issues

### Check Current Policies

Query `pg_policies` to see all active policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Test as a Specific User

To test what a specific user can see/do via the Supabase client:

```sql
-- Set the JWT claim to simulate a user
SET request.jwt.claims = '{"sub": "user-uuid-here", "role": "authenticated"}';
SET role TO authenticated;

-- Now run queries — RLS applies
SELECT * FROM volunteers;  -- should return rows (SELECT policy is true)
INSERT INTO volunteers (first_name, last_name, ...) VALUES (...);  -- should FAIL (INSERT policy is false)

-- Reset
RESET role;
```

### Check if RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Common Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| New user signup fails | `handle_new_user()` not SECURITY DEFINER | Verify function definition |
| Client can't read data | SELECT policy missing or too restrictive | Check `pg_policies` for the table |
| Admin action fails via Supabase client | `is_admin()` function broken or expired role | Test `SELECT is_admin()` directly |
| "permission denied" in server action | This should never happen (Drizzle bypasses RLS) | Check DATABASE_URL is set correctly |

---

## 13. PostgreSQL RLS Concepts Reference

### How RLS Works

1. **Enable RLS:** `ALTER TABLE t ENABLE ROW LEVEL SECURITY;`
   - Without this, policies are ignored
   - Table owner (postgres role) always bypasses RLS unless `FORCE ROW LEVEL SECURITY` is set

2. **Create Policies:** Define rules for who can do what
   - `USING (condition)` — filters rows for SELECT, UPDATE (which rows), DELETE
   - `WITH CHECK (condition)` — validates rows for INSERT, UPDATE (new values)

3. **Default Deny:** If RLS is enabled but no policy matches, the operation returns zero rows (SELECT) or fails (INSERT/UPDATE/DELETE)

### Policy Types

| Type | Keyword | Behavior |
|---|---|---|
| **Permissive** (default) | `CREATE POLICY` | Multiple permissive policies are ORed — access if ANY matches |
| **Restrictive** | `CREATE POLICY ... AS RESTRICTIVE` | Multiple restrictive policies are ANDed — must match ALL |

Our app uses only **permissive** policies. The only table with multiple policies for the same operation is `event_participation` (two INSERT policies), which are ORed correctly.

### USING vs WITH CHECK

| Clause | Used For | Purpose |
|---|---|---|
| `USING` | SELECT, UPDATE (old row), DELETE | "Can you see/touch this existing row?" |
| `WITH CHECK` | INSERT, UPDATE (new row) | "Is this new/modified row valid?" |

For UPDATE policies, you typically set both:
```sql
CREATE POLICY "example"
  ON table FOR UPDATE
  USING (can_see_old_row)       -- which rows can you update?
  WITH CHECK (new_row_is_valid) -- what can the new values be?
```

### SECURITY DEFINER vs SECURITY INVOKER

| Type | Who Runs It | RLS Behavior |
|---|---|---|
| `SECURITY INVOKER` (default) | Calling user | RLS policies apply normally |
| `SECURITY DEFINER` | Function owner (postgres) | RLS is bypassed — function has full access |

Use SECURITY DEFINER when:
- A function needs to access tables restricted by RLS (like our helper functions)
- A trigger needs to modify tables with restrictive policies (like `handle_new_user()`)
- You need to prevent infinite recursion in policy evaluation

### `auth.uid()` and `auth.jwt()`

These are Supabase-provided functions that extract claims from the JWT token:

- `auth.uid()` — Returns the authenticated user's UUID (`sub` claim from JWT)
- `auth.jwt()` — Returns the full JWT claims as JSONB

They only return values when connected via Supabase client (anon key + JWT). When connected via Drizzle (`DATABASE_URL`), `auth.uid()` returns NULL — which is fine because Drizzle bypasses RLS anyway.

---

## 14. FAQ

### Q: If Drizzle bypasses RLS, why bother with policies at all?

RLS is defense-in-depth. It protects against:
- Direct Supabase API access using the anon key (e.g., someone grabs `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your frontend bundle and queries directly)
- Bugs in server action code that accidentally skip auth checks
- Future code that might use Supabase client for data queries

### Q: Can a regular volunteer escalate their role via Supabase client?

No. The INSERT policy on `user_roles` requires `is_admin()`. A regular volunteer's JWT would fail this check. Even if they craft a direct API request, the policy blocks it.

### Q: What happens if I add a new server action but forget the auth check?

If the action uses Drizzle → RLS won't save you (Drizzle bypasses RLS). **Always add `requireAdmin()` or `requireAnyRole()` to every server action.** RLS is a second line of defense, not a replacement for application-level auth.

### Q: Can I use Supabase client for data queries in new features?

Yes, and the RLS policies will automatically apply. But be aware:
- SELECT policies are all `true` — any authenticated user can read everything
- Write policies enforce role checks — make sure the user has the required role
- If you need different read restrictions (e.g., "users can only see their own data"), you'd need new policies

### Q: What if I need to add a RESTRICTIVE policy?

Be careful. Restrictive policies are ANDed with all permissive policies. This means:
- Permissive: "allowed if ANY match"
- Restrictive: "allowed only if ALL match"

Adding a restrictive SELECT policy would filter ALL reads, including the `auth-context.tsx` queries. Test thoroughly.

### Q: How do I verify the policies are working after deployment?

```bash
# Check migration was applied
npm run db:migrate:status

# Verify policy count (should be 25)
# Run in Supabase SQL Editor:
SELECT count(*) FROM pg_policies WHERE schemaname = 'public';

# List all policies
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Q: What about the `_migrations` table — does it need RLS?

The `_migrations` table is an internal bookkeeping table created by our migration runner (`src/db/migrate.ts`). It only stores filenames and timestamps of applied migrations. It does NOT have RLS enabled because:
- It's only accessed by the migration runner via `DATABASE_URL` (postgres role)
- It contains no sensitive data
- No Supabase client code ever queries it
- Enabling RLS would block the migration runner if policies were misconfigured

### Q: What about the Drizzle migration tables (`__drizzle_migrations`, `drizzle` schema)?

Same as `_migrations` — these are internal ORM tracking tables with no sensitive data. RLS is not needed.

---

## Files Referenced in This Guide

| File | Purpose |
|---|---|
| `src/db/migrations/0001_setup.sql` | Original RLS setup, helper functions, triggers |
| `src/db/migrations/0004_rls_policies.sql` | Tightened RLS policies (25 new) |
| `src/db/migrations/0003_auth_auto_link.sql` | `merge_volunteers()` SECURITY DEFINER function |
| `src/db/index.ts` | Drizzle ORM connection (bypasses RLS) |
| `src/lib/supabase/client.ts` | Supabase browser client (RLS enforced) |
| `src/lib/supabase/server.ts` | Supabase server client (RLS enforced) |
| `src/lib/auth-server.ts` | Auth helpers (`getAuthUser`, `requireAdmin`, etc.) |
| `src/lib/auth-cache.ts` | Cached auth helpers with `React.cache()` |
| `src/contexts/auth-context.tsx` | Client-side auth context (2 Supabase queries) |
| `src/db/queries/roles.ts` | `roleIsActiveAndNotExpired` condition |
| `src/db/schema/*.ts` | Drizzle schema definitions for all tables |
| `src/app/actions/*.ts` | Server actions with auth gates |
