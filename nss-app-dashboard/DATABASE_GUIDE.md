# NSS App Database Guide

> **For Future Maintainers**: This guide explains the complete database architecture, how it works, and how to make changes. Read this before touching anything database-related.

**Last Updated**: January 2026
**Original Setup By**: NSS Head (2025-26 Batch)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Understanding the Stack](#2-understanding-the-stack)
3. [File Structure](#3-file-structure)
4. [How It All Works](#4-how-it-all-works)
5. [Common Tasks](#5-common-tasks)
6. [Database Schema](#6-database-schema)
7. [Authentication Flow](#7-authentication-flow)
8. [RLS (Row Level Security)](#8-rls-row-level-security)
9. [SQL Linting with Squawk](#9-sql-linting-with-squawk)
10. [Commands Reference](#10-commands-reference)
11. [Migrating to Another Provider](#11-migrating-to-another-provider)
12. [Troubleshooting](#12-troubleshooting)
13. [FAQs](#13-faqs)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      NSS App Dashboard                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Next.js Application                                             │
│  ├── UI Components (React)                                       │
│  ├── API Routes / Server Actions                                 │
│  └── Database Queries (Drizzle ORM)                             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Drizzle ORM (TypeScript)                                        │
│  ├── Schema definitions (src/db/schema/*.ts)                    │
│  ├── Type-safe queries (src/db/queries.ts)                      │
│  └── Zod validations (src/db/validations.ts)                    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Supabase                                                        │
│  ├── Authentication (signup, login, sessions)                   │
│  ├── PostgreSQL Database (tables, data)                         │
│  └── Realtime (optional)                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Why |
|----------|-----|
| **Drizzle ORM** | Type-safe, lightweight, generates types from schema |
| **TypeScript schema as source of truth** | Single place to define tables, auto-generates types |
| **SQL file for triggers/RLS** | These are PostgreSQL features Drizzle can't manage |
| **No RPC functions** | All business logic in TypeScript (portable, testable) |
| **Portable design** | Can migrate to Neon, Railway, AWS RDS anytime |

---

## 2. Understanding the Stack

### What is Drizzle?

Drizzle is an ORM (Object-Relational Mapper) that lets you:
- Define database tables in TypeScript
- Write type-safe queries
- Auto-generate TypeScript types from your schema

```typescript
// Instead of raw SQL:
const result = await sql`SELECT * FROM volunteers WHERE id = ${id}`

// You write type-safe Drizzle:
const volunteer = await db.query.volunteers.findFirst({
  where: eq(volunteers.id, id)
})
// TypeScript knows volunteer.firstName is a string!
```

### What is Supabase?

Supabase provides:
- **Authentication**: User signup, login, sessions, OAuth
- **PostgreSQL Database**: Where your data lives
- **Realtime**: Subscribe to database changes (optional)

We use Supabase for **auth only**. The database schema is managed by Drizzle.

### Why This Separation?

```
┌─────────────────────────────────────────────────────────────────┐
│  Supabase Auth (auth.users table)                               │
│  └─→ Managed by Supabase, we don't touch it                     │
├─────────────────────────────────────────────────────────────────┤
│  Public Schema (our tables)                                      │
│  └─→ Managed by Drizzle (TypeScript)                            │
│  └─→ Triggers/RLS managed by SQL file                           │
├─────────────────────────────────────────────────────────────────┤
│  Connection between them                                         │
│  └─→ Trigger: When auth.users INSERT → creates volunteer        │
│  └─→ volunteers.auth_user_id links to auth.users.id             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. File Structure

```
src/db/
├── schema/                      # TypeScript schema definitions
│   ├── index.ts                 # Exports all schemas
│   ├── volunteers.ts            # Volunteer table
│   ├── events.ts                # Events table
│   ├── eventParticipation.ts    # Event participation
│   ├── eventCategories.ts       # Event categories
│   ├── roleDefinitions.ts       # Role definitions
│   ├── userRoles.ts             # User-role assignments
│   └── relations.ts             # Table relationships
│
├── migrations/
│   └── 0001_setup.sql           # Auth triggers, RLS, functions, seed data
│
├── index.ts                     # Database connection
├── queries.ts                   # All Drizzle queries
├── validations.ts               # Zod validation schemas
├── setup.ts                     # Setup script (npm run db:setup)
└── diagnose.ts                  # Diagnostic script
```

### What Each File Does

| File | Purpose | When to Edit |
|------|---------|--------------|
| `schema/*.ts` | Table definitions | Adding columns, tables, constraints |
| `migrations/0001_setup.sql` | Triggers, RLS, functions, seed | Adding RLS, triggers, seed data |
| `queries.ts` | Database queries | Adding new query functions |
| `validations.ts` | Input validation | Adding form validations |
| `index.ts` | DB connection | Never (unless changing provider) |

---

## 4. How It All Works

### The Two Sources of Truth

```
┌─────────────────────────────────────────────────────────────────┐
│  SOURCE 1: TypeScript Schema (src/db/schema/*.ts)               │
│  ─────────────────────────────────────────────────────────────  │
│  Defines:                                                        │
│  • Tables and columns                                            │
│  • Data types (text, uuid, integer, etc.)                       │
│  • Indexes                                                       │
│  • Constraints (unique, check, foreign keys)                    │
│  • Default values                                                │
│                                                                  │
│  Applied via: npm run db:push                                   │
├─────────────────────────────────────────────────────────────────┤
│  SOURCE 2: SQL File (src/db/migrations/0001_setup.sql)          │
│  ─────────────────────────────────────────────────────────────  │
│  Defines:                                                        │
│  • Auth triggers (auto-create volunteer on signup)              │
│  • RLS policies (row-level security)                            │
│  • PostgreSQL functions (is_admin, has_role, etc.)              │
│  • Seed data (roles, categories)                                │
│                                                                  │
│  Applied via: npm run db:setup                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Two Sources?

| Feature | Drizzle Can Handle? | Where It Lives |
|---------|--------------------|--------------------|
| Tables, columns | ✅ Yes | TypeScript schema |
| Indexes | ✅ Yes | TypeScript schema |
| Foreign keys | ✅ Yes | TypeScript schema |
| Check constraints | ✅ Yes | TypeScript schema |
| **Triggers** | ❌ No | SQL file |
| **RLS Policies** | ❌ No | SQL file |
| **PL/pgSQL Functions** | ❌ No | SQL file |
| **Seed Data** | ❌ No | SQL file |

Triggers, RLS, and functions run **inside PostgreSQL** - they're database-level features that Drizzle can't create.

---

## 5. Common Tasks

### Adding a New Column

```typescript
// 1. Edit the schema file (e.g., src/db/schema/volunteers.ts)
export const volunteers = pgTable('volunteers', {
  // ... existing columns
  linkedinUrl: text('linkedin_url'),  // ← Add new column
})
```

```bash
# 2. Apply to database
npm run db:push
```

**That's it!** Drizzle detects the change and adds the column.

---

### Adding a New Table

```typescript
// 1. Create new file: src/db/schema/announcements.ts
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Announcement = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert
```

```typescript
// 2. Export from index: src/db/schema/index.ts
export * from './announcements'
```

```bash
# 3. Apply to database
npm run db:push
```

```sql
-- 4. Add RLS (edit src/db/migrations/0001_setup.sql)
-- Add at the end of the file:

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "announcements_insert" ON public.announcements;
CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT TO authenticated WITH CHECK (true);
```

```bash
# 5. Apply RLS
npm run db:setup
```

---

### Adding New Seed Data

```sql
-- Edit: src/db/migrations/0001_setup.sql
-- Add at the end:

INSERT INTO event_categories (category_name, code, description, color_hex, is_active)
VALUES ('New Category', 'new-category', 'Description here', '#FF5733', true)
ON CONFLICT (code) DO NOTHING;
```

```bash
npm run db:setup
```

---

### Adding a New Query

```typescript
// Edit: src/db/queries.ts

export const queries = {
  // ... existing queries

  // Add your new query
  async getAnnouncementsByStatus(isActive: boolean) {
    return db.query.announcements.findMany({
      where: eq(announcements.isActive, isActive),
      orderBy: desc(announcements.createdAt),
    })
  },
}
```

---

### Modifying RLS Policies

```sql
-- Edit: src/db/migrations/0001_setup.sql
-- Find the existing policy and modify it:

DROP POLICY IF EXISTS "volunteers_update" ON public.volunteers;
CREATE POLICY "volunteers_update" ON public.volunteers
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());  -- Users can only update their own record
```

```bash
npm run db:setup
```

---

## 6. Database Schema

### Tables Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   volunteers    │────<│   user_roles    │>────│ role_definitions│
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        │
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     events      │────<│event_participation│>───│   volunteers    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        │
        ▼
┌─────────────────┐
│event_categories │
└─────────────────┘
```

### Table Details

#### volunteers
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| auth_user_id | UUID | Links to Supabase auth.users |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| roll_number | TEXT | Unique roll number |
| email | TEXT | Unique email |
| branch | TEXT | EXCS, CMPN, IT, BIO-MED, EXTC |
| year | TEXT | FE, SE, TE |
| phone_no | TEXT | Phone number |
| is_active | BOOLEAN | Soft delete flag |

#### events
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_name | TEXT | Event name |
| description | TEXT | Event description |
| start_date | DATE | Start date |
| end_date | DATE | End date |
| declared_hours | INTEGER | Hours (1-240) |
| category_id | INTEGER | FK to event_categories |
| event_status | TEXT | planned, ongoing, completed, etc. |
| created_by_volunteer_id | UUID | FK to volunteers |

#### event_participation
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_id | UUID | FK to events |
| volunteer_id | UUID | FK to volunteers |
| hours_attended | INTEGER | Hours attended (0-24) |
| participation_status | TEXT | registered, present, absent, etc. |
| approval_status | TEXT | pending, approved, rejected |

#### role_definitions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| role_name | TEXT | admin, head, volunteer |
| display_name | TEXT | Display name |
| permissions | JSONB | Permission object |
| hierarchy_level | INTEGER | 0-100 (admin=100) |

#### user_roles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| volunteer_id | UUID | FK to volunteers |
| role_definition_id | UUID | FK to role_definitions |
| assigned_by | UUID | FK to volunteers |
| is_active | BOOLEAN | Active flag |

#### event_categories
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| category_name | TEXT | Category name |
| code | TEXT | Unique code |
| color_hex | TEXT | Hex color |
| is_active | BOOLEAN | Active flag |

---

## 7. Authentication Flow

### User Signup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User signs up via Supabase Auth                             │
│     └─→ Supabase creates row in auth.users                      │
├─────────────────────────────────────────────────────────────────┤
│  2. Database trigger fires (on_auth_user_created)               │
│     └─→ Runs handle_new_user() function                         │
├─────────────────────────────────────────────────────────────────┤
│  3. handle_new_user() does:                                     │
│     └─→ Creates volunteer record with auth_user_id              │
│     └─→ Assigns default 'volunteer' role                        │
├─────────────────────────────────────────────────────────────────┤
│  4. User is now linked:                                         │
│     auth.users.id ←──→ volunteers.auth_user_id                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Deletion Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Admin deletes user from Supabase Auth                       │
├─────────────────────────────────────────────────────────────────┤
│  2. Database trigger fires (on_auth_user_deleted)               │
│     └─→ Runs handle_auth_user_deleted() function                │
├─────────────────────────────────────────────────────────────────┤
│  3. handle_auth_user_deleted() does:                            │
│     └─→ Sets volunteer.is_active = false (soft delete)          │
│     └─→ Sets volunteer.auth_user_id = NULL                      │
│     └─→ Deactivates user_roles                                  │
├─────────────────────────────────────────────────────────────────┤
│  4. Volunteer data preserved for records (participation, etc.)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. RLS (Row Level Security)

### What is RLS?

RLS is PostgreSQL's way of controlling which rows users can see/modify. It runs at the database level, so even if your app has a bug, users can't access unauthorized data.

### Current Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| volunteers | All authenticated | All authenticated | Own record only | Disabled |
| events | All authenticated | All authenticated | All authenticated | All authenticated |
| event_participation | All authenticated | All authenticated | All authenticated | All authenticated |
| event_categories | All authenticated | All authenticated | All authenticated | All authenticated |
| role_definitions | All authenticated | Disabled | Disabled | Disabled |
| user_roles | All authenticated | All authenticated | Disabled | Disabled |

### Helper Functions

```sql
-- Check if current user is admin
SELECT is_admin();  -- Returns true/false

-- Check if current user has specific role
SELECT has_role('head');  -- Returns true/false

-- Get current user's volunteer ID
SELECT get_current_volunteer_id();  -- Returns UUID
```

---

## 9. SQL Linting with Squawk

### What is Squawk?

[Squawk](https://squawkhq.com/) is a linter for PostgreSQL migrations. It catches common mistakes and anti-patterns in SQL before they hit your database.

```
┌─────────────────────────────────────────────────────────────────┐
│  🐘 Squawk - PostgreSQL Migration Linter                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  What it catches:                                                │
│  • Unsafe migrations (locks, downtime risks)                    │
│  • Missing indexes on foreign keys                              │
│  • Non-concurrent index creation                                │
│  • Data type issues                                              │
│  • Constraint problems                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How It's Integrated

Squawk runs **automatically** before `db:push` and `db:setup`:

```bash
npm run db:push
# Output:
# > predb:push
# > npm run db:lint
# > squawk src/db/migrations/*.sql
# Found 0 issues in 1 files 🎉
# > drizzle-kit push
```

### Running Manually

```bash
# Lint all SQL files
npm run db:lint

# Or directly
npx squawk src/db/migrations/*.sql
```

### Understanding Squawk Output

```bash
# Example warning:
src/db/migrations/0001_setup.sql:42:1: warning: prefer-text-field
   Prefer using text over varchar

# Example error:
src/db/migrations/0001_setup.sql:15:1: error: adding-not-null-constraint
   Adding a NOT NULL constraint requires a table rewrite
```

### Configured Exclusions

We exclude some rules that don't apply to our setup:

| Rule | Why Excluded |
|------|--------------|
| `prefer-identity` | We use `gen_random_uuid()` for UUIDs |
| `prefer-bigint-over-int` | Serial IDs are fine for our scale |
| `require-concurrent-index-creation` | Initial setup, not live migration |
| `require-timeout-settings` | Handled by Supabase |
| `prefer-robust-stmts` | Our SQL is idempotent |
| `adding-foreign-key-constraint` | Initial setup, tables are empty |
| `constraint-missing-not-valid` | Initial setup, no existing data |

### Squawk Configuration

The exclusions are in `package.json`:

```json
{
  "scripts": {
    "lint:sql": "squawk --exclude=prefer-identity,prefer-bigint-over-int,require-concurrent-index-creation,require-timeout-settings,prefer-robust-stmts,adding-foreign-key-constraint,constraint-missing-not-valid src/db/migrations/*.sql"
  }
}
```

### When to Pay Attention

**For initial setup (empty database):** Most warnings can be ignored.

**For production migrations (live database with data):** Take warnings seriously!

| Warning | Risk Level | What It Means |
|---------|------------|---------------|
| `adding-not-null-constraint` | 🔴 High | Table lock, potential downtime |
| `require-concurrent-index-creation` | 🔴 High | Blocks writes during index creation |
| `adding-foreign-key-constraint` | 🟡 Medium | Brief lock on both tables |
| `prefer-text-field` | 🟢 Low | Style preference |

### Adding Custom Rules

Create `.squawk.toml` in project root:

```toml
# .squawk.toml
excluded_rules = [
  "prefer-identity",
  "prefer-bigint-over-int"
]
```

### Pre-commit Hook

A git pre-commit hook automatically lints SQL files before every commit.

#### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  git commit                                                      │
│       │                                                          │
│       ▼                                                          │
│  .git/hooks/pre-commit runs                                      │
│       │                                                          │
│       ▼                                                          │
│  Checks for staged .sql files                                    │
│       │                                                          │
│       ├─→ No SQL files? → Commit proceeds                        │
│       │                                                          │
│       └─→ SQL files found? → Run Squawk                          │
│                │                                                 │
│                ├─→ Lint passes → Commit proceeds                 │
│                │                                                 │
│                └─→ Lint fails → Commit blocked ❌                │
└─────────────────────────────────────────────────────────────────┘
```

#### Setting Up Pre-commit Hook (For New Clones)

Since `.git` is in the parent repo (`nss-app/`), the hook lives there:

```bash
# From the nss-app-dashboard directory:
cat > ../.git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook for NSS App
# Runs Squawk SQL linter on staged SQL migration files

REPO_ROOT="$(git rev-parse --show-toplevel)"
DASHBOARD_DIR="$REPO_ROOT/nss-app-dashboard"

# Check for staged SQL files
STAGED_SQL=$(git diff --cached --name-only --diff-filter=ACM | grep 'nss-app-dashboard/src/db/migrations/.*\.sql$' || true)

if [ -z "$STAGED_SQL" ]; then
    exit 0  # No SQL files, proceed with commit
fi

echo "🐘 Running Squawk SQL linter..."
echo ""

cd "$DASHBOARD_DIR" || exit 1

LINT_FAILED=0
for file in $STAGED_SQL; do
    RELATIVE_FILE="${file#nss-app-dashboard/}"
    if [ -f "$RELATIVE_FILE" ]; then
        echo "Linting: $RELATIVE_FILE"
        npx squawk --exclude=prefer-identity,prefer-bigint-over-int,require-concurrent-index-creation,require-timeout-settings,prefer-robust-stmts,adding-foreign-key-constraint,constraint-missing-not-valid "$RELATIVE_FILE"
        if [ $? -ne 0 ]; then
            LINT_FAILED=1
        fi
    fi
done

if [ $LINT_FAILED -ne 0 ]; then
    echo ""
    echo "❌ SQL lint failed! Fix the issues above before committing."
    exit 1
fi

echo ""
echo "✅ SQL lint passed!"
exit 0
EOF

# Make it executable
chmod +x ../.git/hooks/pre-commit

echo "✅ Pre-commit hook installed!"
```

#### Verifying the Hook

```bash
# Check hook exists and is executable
ls -la ../.git/hooks/pre-commit

# Test the hook manually
../.git/hooks/pre-commit
```

#### Bypassing the Hook (Emergency Only)

```bash
# Skip pre-commit hook (use sparingly!)
git commit --no-verify -m "Emergency fix"
```

⚠️ **Warning**: Only bypass for genuine emergencies. Always fix lint errors properly.

---

## 10. Commands Reference

| Command | What It Does |
|---------|--------------|
| `npm run db:push` | Pushes TypeScript schema to database |
| `npm run db:setup` | Full setup (schema + SQL migrations) |
| `npm run db:studio` | Opens Drizzle Studio (visual DB browser) |
| `npm run db:lint` | Lints SQL files with Squawk |
| `npm run db:diagnose` | Runs diagnostic checks |
| `npm run db:generate` | Generates migration from schema diff |
| `npm run db:migrate` | Runs pending migrations |
| `npm run db:pull` | Pulls schema from database |
| `npm run db:check` | Checks schema consistency |

### Most Common Workflow

```bash
# After editing TypeScript schema:
npm run db:push

# After editing SQL file (0001_setup.sql):
npm run db:setup

# To explore your database visually:
npm run db:studio
```

---

## 11. Migrating to Another Provider

The setup is designed to be portable. Here's how to migrate:

### To Neon

```bash
# 1. Create Neon project at neon.tech
# 2. Get connection string

# 3. Update .env.local
DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/mydb?sslmode=require"

# 4. Run setup
npm run db:setup

# 5. Done! Your app now uses Neon
```

### To Railway

```bash
# 1. Create Railway project with PostgreSQL
# 2. Get connection string

# 3. Update .env.local
DATABASE_URL="postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway"

# 4. Run setup
npm run db:setup
```

### To AWS RDS

```bash
# 1. Create RDS PostgreSQL instance
# 2. Get connection string

# 3. Update .env.local
DATABASE_URL="postgresql://user:pass@mydb.xxx.us-east-1.rds.amazonaws.com:5432/mydb"

# 4. Run setup
npm run db:setup
```

### Migrating with Existing Data

```bash
# 1. Export data from old database
pg_dump --data-only $OLD_DATABASE_URL > data_backup.sql

# 2. Set up schema on new database
npm run db:setup

# 3. Import data
psql $NEW_DATABASE_URL < data_backup.sql
```

---

## 12. Troubleshooting

### "Column already exists" Error

Drizzle detected a mismatch. Run:
```bash
npm run db:push
```
Select "Yes" to sync.

### "Permission denied" Error

RLS is blocking. Check:
1. Is the user authenticated?
2. Does the RLS policy allow this operation?
3. Run `npm run db:diagnose` to check policies.

### "Foreign key constraint" Error

You're trying to insert a record that references a non-existent row. Check:
1. Does the referenced record exist?
2. Are you using the correct ID?

### Trigger Not Working

```bash
# Check if triggers exist
npm run db:diagnose

# If missing, re-run setup
npm run db:setup
```

### Types Out of Sync

If TypeScript types don't match database:
```bash
# Re-push schema (will sync types)
npm run db:push
```

### Database Connection Issues

Check `.env.local`:
```bash
# Should have:
DATABASE_URL="postgresql://..."
```

---

## 13. FAQs

### Q: Why not use Supabase's auto-generated types?

**A:** Drizzle generates types from TypeScript schema, which is:
- More reliable (single source of truth)
- Works offline
- Portable (not Supabase-specific)

### Q: Why not use Supabase RPC functions?

**A:** We had 36 RPC functions before. Problems:
- Hard to maintain
- Not portable
- No type safety
- Business logic scattered in database

Now all logic is in TypeScript (queries.ts) - testable, portable, type-safe.

### Q: Can I use Supabase Dashboard to edit data?

**A:** Yes! The dashboard still works. But for schema changes, always use:
- TypeScript schema → `db:push`
- SQL file → `db:setup`

### Q: What if I mess up the database?

**A:** Options:
1. Fix the issue and re-run `db:setup`
2. Create new Supabase project and run `db:setup` (fresh start)
3. Restore from Supabase backup (if enabled)

### Q: How do I add a new admin?

```typescript
// Use the admin function (must be called by existing admin)
await supabase.rpc('admin_assign_role', {
  p_volunteer_id: 'volunteer-uuid-here',
  p_role_name: 'admin'
})
```

Or directly in database:
```sql
INSERT INTO user_roles (volunteer_id, role_definition_id, is_active)
SELECT
  'volunteer-uuid-here',
  id,
  true
FROM role_definitions
WHERE role_name = 'admin';
```

### Q: Why is there only one SQL file?

**A:** Because it's **idempotent** (safe to run multiple times). Instead of numbered migrations, we have one file that can be re-run anytime. This is simpler and works great for our use case.

### Q: When would I need a second SQL file?

**A:** Almost never. Only for one-time data migrations that can't be re-run. For everything else, just edit `0001_setup.sql` and run `db:setup`.

### Q: How do I debug queries?

```typescript
// Enable query logging in src/db/index.ts
const db = drizzle(pool, {
  schema,
  logger: true  // ← Add this
})
```

### Q: Is the database backed up?

Supabase has automatic daily backups (Pro plan). For free tier, manually export:
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                     QUICK REFERENCE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Add column:     Edit schema/*.ts → npm run db:push             │
│  Add table:      Create schema/*.ts + export → npm run db:push  │
│  Add RLS:        Edit 0001_setup.sql → npm run db:setup         │
│  Add seed data:  Edit 0001_setup.sql → npm run db:setup         │
│  Add query:      Edit queries.ts                                 │
│  View database:  npm run db:studio                               │
│  Check health:   npm run db:diagnose                             │
│  Lint SQL:       npm run db:lint                                 │
│                                                                  │
│  Full fresh setup: npm run db:setup                              │
│  Setup pre-commit hook: See Section 9                            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                     FILE LOCATIONS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Schema:      src/db/schema/*.ts                                │
│  Queries:     src/db/queries.ts                                 │
│  SQL setup:   src/db/migrations/0001_setup.sql                  │
│  Connection:  src/db/index.ts                                   │
│  Validation:  src/db/validations.ts                             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                     NEED HELP?                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Drizzle docs:    https://orm.drizzle.team                      │
│  Supabase docs:   https://supabase.com/docs                     │
│  PostgreSQL docs: https://www.postgresql.org/docs               │
│  Squawk docs:     https://squawkhq.com/docs                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Remember**: When in doubt, read this guide first. The architecture is intentionally simple - TypeScript for schema, one SQL file for everything else. Keep it that way!
