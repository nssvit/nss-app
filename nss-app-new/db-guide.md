# NSS App - Database Guide

**For:** Any developer maintaining or extending this project's database layer.
**Stack:** Next.js 15 + Supabase (PostgreSQL) + Drizzle ORM + Raw SQL Migrations

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [How the Two Database Layers Work](#3-how-the-two-database-layers-work)
4. [Database Schema Reference](#4-database-schema-reference)
5. [Migration System](#5-migration-system)
6. [npm Scripts Reference](#6-npm-scripts-reference)
7. [Common Workflows](#7-common-workflows)
8. [Drizzle ORM Primer](#8-drizzle-orm-primer)
9. [Query Layer Architecture](#9-query-layer-architecture)
10. [Validation Layer](#10-validation-layer)
11. [Auth Flow (Supabase + Database)](#11-auth-flow-supabase--database)
12. [SQL Functions & Triggers](#12-sql-functions--triggers)
13. [RLS Policies](#13-rls-policies)
14. [Seed Data](#14-seed-data)
15. [Environment Setup](#15-environment-setup)
16. [Git Workflow for DB Changes](#16-git-workflow-for-db-changes)
17. [Troubleshooting](#17-troubleshooting)
18. [Rules & Constraints Quick Reference](#18-rules--constraints-quick-reference)

---

## 1. Architecture Overview

This project uses a **dual-layer** database approach:

```
┌───────────────────────────────────────────────────┐
│                   Next.js App                     │
│                                                   │
│  Client-Side (Browser)     Server-Side (Actions)  │
│  ┌──────────────────┐     ┌────────────────────┐  │
│  │  Supabase Client │     │    Drizzle ORM     │  │
│  │  (RLS enforced)  │     │  (bypasses RLS)    │  │
│  └────────┬─────────┘     └────────┬───────────┘  │
│           │                        │              │
└───────────┼────────────────────────┼──────────────┘
            │                        │
            ▼                        ▼
┌───────────────────────────────────────────────────┐
│             Supabase PostgreSQL                   │
│                                                   │
│  Tables (Drizzle schema)                          │
│  Triggers & Functions (SQL migrations)            │
│  RLS Policies (SQL migrations)                    │
│  Seed Data (SQL migrations)                       │
└───────────────────────────────────────────────────┘
```

**Why two layers?**

| Layer | Used For | RLS? |
|---|---|---|
| **Supabase Client** | Auth (login/signup/logout), real-time subscriptions, client-side queries | Yes - rows filtered by JWT |
| **Drizzle ORM** | Server actions, API routes, admin operations, reports | No - full access, app code checks permissions |

---

## 2. Directory Structure

```
src/db/
├── index.ts                  # Drizzle connection (db instance)
├── setup.ts                  # Fresh database setup script
├── migrate.ts                # Incremental migration runner
├── validations.ts            # Zod schemas (drizzle-zod) for input validation
├── queries.ts                # Legacy barrel file (use queries/ instead)
│
├── schema/                   # Drizzle table definitions (source of truth for structure)
│   ├── index.ts              # Re-exports all tables + relations
│   ├── volunteers.ts         # volunteers table
│   ├── events.ts             # events table
│   ├── eventParticipation.ts # event_participation table
│   ├── eventCategories.ts    # event_categories table
│   ├── roleDefinitions.ts    # role_definitions table
│   ├── userRoles.ts          # user_roles table
│   └── relations.ts          # Drizzle relation definitions (for .query API)
│
├── queries/                  # Drizzle query functions (one file per domain)
│   ├── index.ts              # Barrel export + backwards-compatible `queries` object
│   ├── dashboard.ts          # Dashboard stats queries
│   ├── events.ts             # Event CRUD queries
│   ├── attendance.ts         # Attendance & registration queries
│   ├── hours.ts              # Hours approval workflow queries
│   ├── volunteers.ts         # Volunteer queries + admin operations
│   ├── roles.ts              # Role assignment queries
│   └── reports.ts            # Reporting & analytics queries
│
└── migrations/               # SQL migration files (ordered by number)
    ├── 0001_setup.sql        # Auth triggers, RLS, helper functions, seed data
    └── 0002_schema_cleanup.sql # Date column fixes, dropped redundant columns
```

### What lives where:

| What | Where | Why |
|---|---|---|
| Table columns, types, indexes, CHECK constraints | `schema/*.ts` | Drizzle manages structural DDL |
| Triggers, functions, RLS policies, seed data | `migrations/*.sql` | These are PostgreSQL-specific, Drizzle can't express them |
| Query logic | `queries/*.ts` | Type-safe Drizzle queries with raw SQL where needed |
| Input validation | `validations.ts` | Zod schemas generated from Drizzle schemas via `drizzle-zod` |

---

## 3. How the Two Database Layers Work

### Layer 1: Drizzle Schema (Structure)

Drizzle schema files define **what tables look like** — columns, types, indexes, constraints, foreign keys. When you run `drizzle-kit push` or `drizzle-kit generate`, Drizzle reads these files and syncs the database structure.

```typescript
// src/db/schema/events.ts
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventName: text('event_name').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  // ...
})
```

**Drizzle handles:** Tables, columns, types, indexes, foreign keys, CHECK constraints, unique constraints.

### Layer 2: SQL Migrations (Behavior)

SQL migration files define **how the database behaves** — triggers that fire on auth events, RLS policies that restrict row access, functions that compute things, seed data.

```sql
-- src/db/migrations/0001_setup.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$ ... $$;
```

**SQL handles:** Triggers, functions, RLS policies, grants, seed data, anything PostgreSQL-specific that Drizzle can't express.

### How they work together:

1. `setup.ts` runs `drizzle-kit push` first (creates tables), then runs SQL migrations (adds behavior on top)
2. `migrate.ts` only runs new SQL migrations (assumes tables already exist)
3. For schema-only changes (new column), edit Drizzle files and use `db:generate` + `db:migrate`
4. For behavior changes (new trigger), write a SQL migration file and use `db:migrate`

---

## 4. Database Schema Reference

### 4.1 `volunteers`

The core user table. Every authenticated user gets a volunteer record via the signup trigger.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `auth_user_id` | UUID (unique) | Links to `auth.users` (Supabase) |
| `first_name` | TEXT (NOT NULL) | |
| `last_name` | TEXT (NOT NULL) | |
| `roll_number` | TEXT (NOT NULL, unique) | Student roll number |
| `email` | TEXT (NOT NULL, unique) | |
| `branch` | TEXT (NOT NULL) | CHECK: `EXCS`, `CMPN`, `IT`, `BIO-MED`, `EXTC` |
| `year` | TEXT (NOT NULL) | CHECK: `FE`, `SE`, `TE` |
| `phone_no` | TEXT | 10-digit number |
| `birth_date` | DATE | |
| `gender` | TEXT | CHECK: `M`, `F`, `Prefer not to say` |
| `nss_join_year` | INTEGER | |
| `address` | TEXT | |
| `profile_pic` | TEXT | URL |
| `is_active` | BOOLEAN (default: true) | Soft delete flag |
| `created_at` | TIMESTAMPTZ | Auto-set |
| `updated_at` | TIMESTAMPTZ | Auto-updated by trigger |

**Indexes:** `auth_user_id`, `branch`, `year`, `is_active`, `email`, `roll_number`

### 4.2 `events`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `event_name` | TEXT (NOT NULL) | |
| `description` | TEXT | |
| `start_date` | TIMESTAMPTZ (NOT NULL) | Event start (date + time) |
| `end_date` | TIMESTAMPTZ (NOT NULL) | Event end. CHECK: `end_date >= start_date` |
| `declared_hours` | INTEGER (NOT NULL) | Hours credited. CHECK: 1-240 |
| `category_id` | INTEGER (FK -> event_categories) | |
| `min_participants` | INTEGER | |
| `max_participants` | INTEGER | CHECK: `>= min_participants` |
| `event_status` | TEXT (NOT NULL, default: 'planned') | See status values below |
| `location` | TEXT | |
| `registration_deadline` | TIMESTAMPTZ | |
| `created_by_volunteer_id` | UUID (FK -> volunteers, RESTRICT) | |
| `is_active` | BOOLEAN (default: true) | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

**Event Status Values:** `planned`, `registration_open`, `registration_closed`, `ongoing`, `completed`, `cancelled`

**Declared Hours Range:** 1-240 (supports single-day events of 1hr up to 10-day NSS camps at 24hrs/day)

### 4.3 `event_participation`

Join table between events and volunteers. Also tracks hours and approval workflow.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `event_id` | UUID (FK -> events, CASCADE) | |
| `volunteer_id` | UUID (FK -> volunteers, CASCADE) | |
| `hours_attended` | INTEGER (NOT NULL, default: 0) | CHECK: 0-24 |
| `approved_hours` | INTEGER | CHECK: 0-24. Set after approval |
| `participation_status` | TEXT (NOT NULL, default: 'registered') | See values below |
| `registration_date` | TIMESTAMPTZ | |
| `attendance_date` | TIMESTAMPTZ | |
| `notes` | TEXT | |
| `feedback` | TEXT | |
| `recorded_by_volunteer_id` | UUID (FK -> volunteers, SET NULL) | Who marked attendance |
| `approval_status` | TEXT (NOT NULL, default: 'pending') | `pending`, `approved`, `rejected` |
| `approved_by` | UUID (FK -> volunteers, SET NULL) | Who approved hours |
| `approved_at` | TIMESTAMPTZ | |
| `approval_notes` | TEXT | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

**Participation Status Values:** `registered`, `present`, `absent`, `partially_present`, `excused`

**Unique Constraint:** One record per `(event_id, volunteer_id)` — a volunteer can only register once per event.

**Hours Workflow:**
```
Volunteer registers -> participation_status = 'registered'
Head marks attendance -> participation_status = 'present', hours_attended = N
Approval pending -> approval_status = 'pending'
Admin/Head approves -> approval_status = 'approved', approved_hours = N
```

### 4.4 `event_categories`

Lookup table. Seeded with 10 categories.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL (PK) | Auto-incrementing integer |
| `category_name` | TEXT (NOT NULL, unique) | e.g., "Blood Donation" |
| `code` | TEXT (NOT NULL, unique) | e.g., "blood-donation" |
| `description` | TEXT | |
| `color_hex` | TEXT (default: '#6366F1') | UI color for badges |
| `is_active` | BOOLEAN | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### 4.5 `role_definitions`

Defines available roles. Seeded with 3 roles.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `role_name` | TEXT (NOT NULL, unique) | `admin`, `head`, `volunteer` |
| `display_name` | TEXT (NOT NULL) | |
| `description` | TEXT | |
| `permissions` | JSONB (NOT NULL, default: {}) | Granular permission map |
| `hierarchy_level` | INTEGER (NOT NULL, default: 0) | CHECK: 0-100. Higher = more privilege |
| `is_active` | BOOLEAN | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

**Seeded Roles:**

| Role | Hierarchy | Purpose |
|---|---|---|
| `admin` | 100 | Full system access |
| `head` | 50 | Manage events, take attendance, approve hours |
| `volunteer` | 10 | Register for events, view own data |

### 4.6 `user_roles`

Join table: which volunteer has which role.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `volunteer_id` | UUID (FK -> volunteers, CASCADE) | |
| `role_definition_id` | UUID (FK -> role_definitions, CASCADE) | |
| `assigned_by` | UUID (FK -> volunteers, SET NULL) | |
| `assigned_at` | TIMESTAMPTZ | |
| `expires_at` | TIMESTAMPTZ | Optional role expiration |
| `is_active` | BOOLEAN | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

**Unique Constraint:** One record per `(volunteer_id, role_definition_id)`.

### Entity Relationship Diagram

```
event_categories (1) ──── (*) events
volunteers (1) ──── (*) events (created_by)
volunteers (1) ──── (*) event_participation
events (1) ──── (*) event_participation
volunteers (1) ──── (*) user_roles
role_definitions (1) ──── (*) user_roles
```

---

## 5. Migration System

### How it works

We have a custom migration tracker that stores which SQL files have been applied:

```
┌──────────────────────────────────────────────┐
│             _migrations table                │
├────┬──────────────────────────┬──────────────┤
│ id │ filename                 │ applied_at   │
├────┼──────────────────────────┼──────────────┤
│  1 │ 0001_setup.sql           │ 2026-02-14   │
│  2 │ 0002_schema_cleanup.sql  │ 2026-02-14   │
└────┴──────────────────────────┴──────────────┘
```

When `npm run db:migrate` runs:
1. Creates `_migrations` table if missing
2. Reads all `.sql` files in `src/db/migrations/` (sorted by name, excluding `0000_*` files)
3. Compares against `_migrations` table
4. Runs only the **new** ones, in order
5. Records each one after success
6. Stops on error (already-applied migrations are safe)

### Two scripts

| Script | When to use |
|---|---|
| `npm run db:setup` | **Fresh/empty database only.** Runs `drizzle-kit push` (creates all tables), then runs ALL SQL migrations, records them all in `_migrations`. |
| `npm run db:migrate` | **Existing database with data.** Only runs SQL migrations not yet recorded in `_migrations`. Safe to run repeatedly. |

### Migration naming convention

```
NNNN_short_description.sql
```

- `NNNN` = zero-padded number, incrementing (0001, 0002, 0003...)
- Files starting with `0000` are ignored (Drizzle generates these for its own tracking)
- Files are sorted alphabetically, so numbering ensures correct order

### Current migrations

| File | What it does |
|---|---|
| `0001_setup.sql` | Auth triggers, RLS policies, helper functions, admin SQL functions, updated_at triggers, seed data (3 roles, 10 categories) |
| `0002_schema_cleanup.sql` | Converts date columns to timestamps, drops redundant `event_date` column, drops `event_participation.declared_hours`, drops 6 unused admin SQL functions |

---

## 6. npm Scripts Reference

```bash
# === Database Commands ===

npm run db:setup            # Fresh database: push schema + run all migrations
npm run db:migrate          # Run only pending migrations
npm run db:migrate:status   # Show which migrations are applied vs pending

npm run db:push             # Push Drizzle schema directly (tables only, no migrations)
npm run db:generate         # Generate a migration SQL from Drizzle schema diff
npm run db:studio           # Open Drizzle Studio (visual DB browser at localhost)
```

### When to use which:

| Scenario | Command |
|---|---|
| Setting up a brand new database | `npm run db:setup` |
| Applying pending changes to existing DB | `npm run db:migrate` |
| Checking what's applied | `npm run db:migrate:status` |
| Quick schema push during development (no migration file needed) | `npm run db:push` |
| Creating a migration file from schema changes | `npm run db:generate` |
| Browsing data visually | `npm run db:studio` |

---

## 7. Common Workflows

### 7.1 Adding a new column to an existing table

```bash
# 1. Edit the Drizzle schema file
#    e.g., add `bio: text('bio')` to src/db/schema/volunteers.ts

# 2. Generate a migration
npm run db:generate
#    This creates a file like: src/db/migrations/0003_add_bio_column.sql

# 3. Apply it
npm run db:migrate
```

### 7.2 Adding a new table

```bash
# 1. Create a new schema file: src/db/schema/notifications.ts
#    Define the pgTable with all columns, indexes, constraints

# 2. Export it from src/db/schema/index.ts
#    Add: export * from './notifications'

# 3. Add relations in src/db/schema/relations.ts if needed

# 4. Generate migration
npm run db:generate

# 5. Apply it
npm run db:migrate

# 6. (Optional) Add query functions in src/db/queries/notifications.ts
# 7. (Optional) Add validation schemas in src/db/validations.ts
```

### 7.3 Adding a new trigger or function

```bash
# 1. Create a new SQL file: src/db/migrations/0003_add_notification_trigger.sql
#    Write your CREATE FUNCTION + CREATE TRIGGER SQL

# 2. Apply it
npm run db:migrate
```

### 7.4 Adding seed data

```bash
# 1. Create a new SQL file: src/db/migrations/0003_seed_new_categories.sql
#    Write INSERT ... ON CONFLICT DO NOTHING statements

# 2. Apply it
npm run db:migrate
```

### 7.5 Updating RLS policies

```bash
# 1. Create a new SQL file: src/db/migrations/0003_update_rls.sql
#    Use DROP POLICY IF EXISTS + CREATE POLICY pattern (idempotent)

# 2. Apply it
npm run db:migrate
```

### 7.6 Setting up a new developer's database

```bash
# 1. Create a Supabase project (or get connection string from team)
# 2. Copy .env.local.example to .env.local, fill in DATABASE_URL
# 3. Run:
npm run db:setup
# Done. All tables, triggers, RLS, seeds, everything.
```

### 7.7 Syncing after pulling new code

```bash
git pull
npm install          # in case dependencies changed
npm run db:migrate   # applies any new migrations from teammates
```

---

## 8. Drizzle ORM Primer

### What is Drizzle?

Drizzle is a TypeScript ORM that generates SQL from TypeScript definitions. Unlike Prisma, it doesn't use a custom schema language — your schema IS TypeScript.

### Key concepts

**Schema definition** — Each table is a `pgTable()` call:
```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const volunteers = pgTable('volunteers', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  // ...
})
```

The first argument to each column helper (e.g., `'first_name'`) is the **actual database column name**. The TypeScript property name (`firstName`) is what you use in code.

**Relations** — Defined separately for the `.query` API:
```typescript
export const volunteersRelations = relations(volunteers, ({ many }) => ({
  assignedRoles: many(userRoles),
  participations: many(eventParticipation),
}))
```

**Two query APIs:**

```typescript
// 1. SQL-like API (select/insert/update/delete)
const result = await db.select().from(volunteers).where(eq(volunteers.branch, 'CMPN'))

// 2. Relational API (uses relations defined above)
const result = await db.query.volunteers.findMany({
  with: { assignedRoles: true }
})
```

**Raw SQL when needed:**
```typescript
import { sql } from 'drizzle-orm'

const result = await db.execute(sql`
  SELECT v.*, COUNT(ep.id) as event_count
  FROM volunteers v
  LEFT JOIN event_participation ep ON ep.volunteer_id = v.id
  GROUP BY v.id
`)
```

### Configuration

`drizzle.config.ts` tells Drizzle where things are:
```typescript
export default defineConfig({
  schema: './src/db/schema/index.ts',  // Where table definitions live
  out: './src/db/migrations',           // Where generated migrations go
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### Connection

`src/db/index.ts` creates a single `db` instance optimized for serverless:
```typescript
const client = postgres(process.env.DATABASE_URL, {
  max: 5,           // Connection pool size
  idle_timeout: 20,  // Close idle connections after 20s
  prepare: false,    // Required for Supabase connection pooler
})

export const db = drizzle(client, { schema })
```

**Import in server code:**
```typescript
import { db } from '@/db'
```

---

## 9. Query Layer Architecture

Queries are organized by domain in `src/db/queries/`:

```
queries/
├── index.ts          # Barrel exports + backwards-compatible `queries` object
├── dashboard.ts      # getDashboardStats, getMonthlyActivityTrends
├── events.ts         # getEventsWithStats, createEvent, updateEvent, ...
├── attendance.ts     # markEventAttendance, registerForEvent, bulkMarkAttendance, ...
├── hours.ts          # getPendingParticipations, approveHoursTransaction, ...
├── volunteers.ts     # getVolunteerById, adminGetAllVolunteers, ...
├── roles.ts          # getVolunteerRoles, adminAssignRole, ...
└── reports.ts        # getCategoryDistribution, getTopEventsByImpact, ...
```

### Two ways to import:

```typescript
// Named imports (preferred)
import { getEventsWithStats, createEvent } from '@/db/queries'

// Namespace object (backwards-compatible)
import { queries } from '@/db/queries'
const events = await queries.getEventsWithStats()
```

### Query patterns used:

**Simple Drizzle query:**
```typescript
export async function getVolunteerById(id: string) {
  return db.query.volunteers.findFirst({
    where: eq(volunteers.id, id),
    with: { assignedRoles: { with: { roleDefinition: true } } }
  })
}
```

**Raw SQL for complex joins/aggregations:**
```typescript
export async function getEventsWithStats(filters) {
  const result = await db.execute(sql`
    SELECT e.*, c.category_name, COUNT(ep.id) as participant_count
    FROM events e
    LEFT JOIN event_categories c ON c.id = e.category_id
    LEFT JOIN event_participation ep ON ep.event_id = e.id
    WHERE e.is_active = true
    GROUP BY e.id, c.category_name
  `)
  return result.rows
}
```

**Transactions for multi-step operations:**
```typescript
export async function approveHoursTransaction(participationId, approvedBy, hours) {
  return db.transaction(async (tx) => {
    await tx.update(eventParticipation)
      .set({ approvalStatus: 'approved', approvedHours: hours, approvedBy })
      .where(eq(eventParticipation.id, participationId))
    // ... additional operations in same transaction
  })
}
```

---

## 10. Validation Layer

`src/db/validations.ts` uses `drizzle-zod` to generate Zod schemas from Drizzle table definitions, with custom overrides:

```typescript
import { createInsertSchema } from 'drizzle-zod'

export const insertVolunteerSchema = createInsertSchema(volunteers, {
  email: (schema) => schema.email('Invalid email format'),
  branch: () => z.enum(['EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC']),
  year: () => z.enum(['FE', 'SE', 'TE']),
})
```

This gives you:
- `insertVolunteerSchema` — validate data before INSERT
- `updateVolunteerSchema` — same but all fields optional (`.partial()`)
- `selectVolunteerSchema` — validate data coming FROM the database

Use in server actions:
```typescript
const parsed = insertEventSchema.parse(formData)
// If invalid, Zod throws with field-level error messages
```

---

## 11. Auth Flow (Supabase + Database)

### Signup Flow

```
User fills signup form
    ↓
Supabase auth.signUp({ email, password, options: { data: { first_name, last_name, roll_number, branch, year } } })
    ↓
Supabase creates auth.users row
    ↓
PostgreSQL trigger fires: on_auth_user_created → handle_new_user()
    ↓
handle_new_user() reads raw_user_meta_data and:
  1. Creates a volunteers row (auth_user_id = auth.users.id)
  2. Looks up the 'volunteer' role_definition
  3. Creates a user_roles row (assigns volunteer role)
    ↓
User is now: authenticated + has a volunteer record + has 'volunteer' role
```

**The signup form MUST send DB-compatible values:**
- `branch` must be one of: `EXCS`, `CMPN`, `IT`, `BIO-MED`, `EXTC`
- `year` must be one of: `FE`, `SE`, `TE`

If wrong values are sent, the DB CHECK constraint rejects the insert and signup fails silently.

### Auth Delete Flow

```
Auth user deleted (via Supabase Dashboard or Admin API)
    ↓
PostgreSQL trigger fires: on_auth_user_deleted → handle_auth_user_deleted()
    ↓
Soft-deletes the volunteer:
  - volunteers.is_active = false
  - volunteers.auth_user_id = NULL
  - All user_roles.is_active = false
```

Data is **never hard-deleted** — volunteer participation history is preserved.

---

## 12. SQL Functions & Triggers

### Active Functions

| Function | Type | Purpose |
|---|---|---|
| `handle_new_user()` | TRIGGER (SECURITY DEFINER) | Creates volunteer + assigns role on signup |
| `handle_auth_user_deleted()` | TRIGGER (SECURITY DEFINER) | Soft-deletes volunteer on auth deletion |
| `trigger_set_updated_at()` | TRIGGER | Auto-updates `updated_at` on every UPDATE |
| `is_admin(user_id)` | HELPER (SECURITY DEFINER) | Returns boolean — is this auth user an admin? |
| `has_role(role_name, user_id)` | HELPER (SECURITY DEFINER) | Returns boolean — does this auth user have this role? |
| `get_current_volunteer_id()` | HELPER (SECURITY DEFINER) | Returns UUID of volunteer for current JWT user |

### Active Triggers

| Trigger | Table | Event | Function |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` |
| `on_auth_user_deleted` | `auth.users` | BEFORE DELETE | `handle_auth_user_deleted()` |
| `set_updated_at` | All 6 tables | BEFORE UPDATE | `trigger_set_updated_at()` |

### Dropped Functions (Migration 0002)

These were replaced by Drizzle ORM queries in `src/db/queries/`:
- `admin_delete_volunteer` -> `queries/volunteers.ts`
- `admin_deactivate_volunteer` -> `queries/volunteers.ts`
- `admin_reactivate_volunteer` -> `queries/volunteers.ts`
- `admin_assign_role` -> `queries/roles.ts`
- `admin_revoke_role` -> `queries/roles.ts`
- `admin_verify_volunteer` -> `queries/volunteers.ts`

---

## 13. RLS Policies

Row Level Security is enabled on all 6 tables. Current policies are **permissive** (placeholder) — they allow all authenticated users to read everything:

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `volunteers` | All authenticated | All authenticated | Own record only (`auth_user_id = auth.uid()`) | Denied |
| `events` | All authenticated | All authenticated | All authenticated | All authenticated |
| `event_participation` | All authenticated | All authenticated | All authenticated | All authenticated |
| `event_categories` | All authenticated | All authenticated | All authenticated | All authenticated |
| `role_definitions` | All authenticated | Denied | Denied | Denied |
| `user_roles` | All authenticated | All authenticated | Denied | Denied |

**Note:** These are intentionally broad. Fine-grained RLS (admin-only writes, etc.) is planned as a separate migration. Currently, authorization is enforced in application code (server actions check roles before allowing operations).

---

## 14. Seed Data

Inserted by `0001_setup.sql` using `ON CONFLICT DO NOTHING` (safe to re-run):

### Roles (3)

| role_name | display_name | hierarchy_level |
|---|---|---|
| `admin` | Administrator | 100 |
| `head` | NSS Head | 50 |
| `volunteer` | Volunteer | 10 |

### Event Categories (10)

| code | category_name | color |
|---|---|---|
| `community-service` | Community Service | #10B981 |
| `blood-donation` | Blood Donation | #EF4444 |
| `environmental` | Environmental | #22C55E |
| `health-camp` | Health Camp | #3B82F6 |
| `education` | Education | #8B5CF6 |
| `cleanliness-drive` | Cleanliness Drive | #06B6D4 |
| `workshop` | Workshop | #F59E0B |
| `cultural` | Cultural | #EC4899 |
| `sports` | Sports | #F97316 |
| `awareness-campaign` | Awareness Campaign | #6366F1 |

---

## 15. Environment Setup

### Required environment variable

```env
# .env.local
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Get this from: **Supabase Dashboard > Project Settings > Database > Connection string > URI** (use the **Transaction pooler** connection for serverless).

### Other Supabase env vars (for the Supabase client, not Drizzle):

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### First-time setup:

```bash
cd nss-app-new
npm install
# Fill in .env.local with your Supabase credentials
npm run db:setup
npm run dev
```

---

## 16. Git Workflow for DB Changes

### Rule: Database changes are committed like code

Every database change should be:
1. Expressed in a Drizzle schema file OR a SQL migration file
2. Committed to git
3. Applied by other developers via `npm run db:migrate`

**Never make database changes directly in the Supabase Dashboard** that aren't also reflected in the codebase. If you do, other developers (and production) won't have those changes.

### Branching strategy

```bash
# Working on a feature that needs DB changes:
git checkout -b feature/add-notifications

# 1. Edit schema files or create migration SQL
# 2. Test locally: npm run db:migrate
# 3. Commit everything:
git add src/db/schema/notifications.ts
git add src/db/migrations/0003_notifications.sql
git commit -m "feat: add notifications table and trigger"

# 4. PR and merge
# 5. Other devs pull and run: npm run db:migrate
```

### Conflict resolution

If two developers create migrations with the same number (e.g., both create `0003_*.sql`), one of them needs to rename theirs to `0004_*.sql`. The migration runner sorts by filename, so ordering matters.

### Production deployment

```bash
# On deploy (Vercel/etc), run:
npm run db:migrate
# This only applies new migrations, safe for production
```

**Never run `db:setup` on a production database** — it pushes schema from scratch which can be destructive.

---

## 17. Troubleshooting

### "DATABASE_URL environment variable is not set"

Create `.env.local` in the `nss-app-new/` directory with your Supabase DATABASE_URL.

### Migration fails with "already exists"

The SQL is trying to create something that already exists. Use `IF NOT EXISTS` / `OR REPLACE` patterns in your SQL:
```sql
CREATE TABLE IF NOT EXISTS ...
CREATE OR REPLACE FUNCTION ...
DROP POLICY IF EXISTS "..." ON ...; CREATE POLICY ...
```

### "prepared statement already exists"

Your Drizzle connection needs `prepare: false`. This is already set in `src/db/index.ts`. If you're creating a custom connection, make sure to include it.

### Schema drift (DB doesn't match Drizzle files)

```bash
# Check what Drizzle thinks needs to change:
npm run db:push
# It will show a diff and ask for confirmation
```

### "permission denied for table"

RLS is enabled. Make sure you're connecting as an authenticated user (via Supabase client) or using the `DATABASE_URL` connection (Drizzle, which bypasses RLS).

### Migration partially applied

The migration runner records each file AFTER it succeeds. If a migration fails halfway:
1. The `_migrations` table does NOT have that filename
2. Fix the SQL file or the data issue
3. Re-run `npm run db:migrate` — it will retry that file

### Check migration status anytime

```bash
npm run db:migrate:status

# Output:
# Migration Status:
#   ✅ applied  0001_setup.sql
#   ✅ applied  0002_schema_cleanup.sql
#   ⏳ pending  0003_new_feature.sql
#
#   Total: 3 | Applied: 2 | Pending: 1
```

---

## 18. Rules & Constraints Quick Reference

### Branch values (DB CHECK constraint)
```
EXCS | CMPN | IT | BIO-MED | EXTC
```

### Year values (DB CHECK constraint)
```
FE | SE | TE
```

### Gender values (DB CHECK constraint)
```
M | F | Prefer not to say | NULL
```

### Event status values (DB CHECK constraint)
```
planned | registration_open | registration_closed | ongoing | completed | cancelled
```

### Participation status values (DB CHECK constraint)
```
registered | present | absent | partially_present | excused
```

### Approval status values (DB CHECK constraint)
```
pending | approved | rejected
```

### Role hierarchy (higher number = more privilege)
```
admin = 100 | head = 50 | volunteer = 10
```

### Numeric constraints
```
declared_hours:      1 - 240  (event level)
hours_attended:      0 - 24   (per participation)
approved_hours:      0 - 24   (per participation)
hierarchy_level:     0 - 100  (role definitions)
```

### Soft delete pattern
Every table has `is_active BOOLEAN DEFAULT true`. Records are never hard-deleted in normal operations — `is_active` is set to `false`. All queries should filter by `is_active = true` unless specifically looking at archived data.

### Timestamps
All timestamps use `TIMESTAMP WITH TIME ZONE`. Never use bare `DATE` or `TIMESTAMP` without timezone.

### Foreign key behavior
```
events.created_by_volunteer_id -> volunteers.id    ON DELETE RESTRICT  (can't delete creator)
event_participation.event_id   -> events.id        ON DELETE CASCADE   (delete event = delete participations)
event_participation.volunteer_id -> volunteers.id   ON DELETE CASCADE   (delete volunteer = delete participations)
user_roles.volunteer_id        -> volunteers.id     ON DELETE CASCADE
user_roles.role_definition_id  -> role_definitions.id ON DELETE CASCADE
*_approved_by / *_recorded_by  -> volunteers.id     ON DELETE SET NULL  (preserve records)
```
