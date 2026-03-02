# Migration Guide: Supabase Auth → Better Auth + Dual DB Failover

## Overview

This guide migrates the NSS app from Supabase Auth to Better Auth, and sets up Neon PostgreSQL as a standby database with admin-controlled failover.

**What changes:**
- Authentication moves from Supabase's `auth.users` (separate schema) into Better Auth's `user`, `session`, `account`, `verification` tables in your own `public` schema
- Existing users keep their credentials (bcrypt hashes are preserved)
- A second PostgreSQL database (Neon) can be configured as a hot standby
- Admins can switch between databases from Settings → Database Provider

**What does NOT change:**
- All existing tables (`volunteers`, `events`, `attendance`, `user_roles`, etc.)
- All Drizzle queries
- All server actions (except auth-related ones)
- Role system, audit logs, Redis caching

---

## Prerequisites

- `pg_dump` and `psql` available in your PATH
- Node.js 18+ and npm
- Access to your Supabase project dashboard
- (Later) A Neon account at [neon.tech](https://neon.tech)

If you don't have `pg_dump`/`psql`:

```bash
# macOS
brew install libpq
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
pg_dump --version
psql --version
```

---

## Phase 0: Backup (DO THIS FIRST)

**Never skip this step.** If anything goes wrong, this is your safety net.

### Option A: CLI backup (recommended)

```bash
cd nss-app-new

# Load your env vars
source <(grep -v '^#' .env.local | sed 's/^/export /')

# Full database backup
# NOTE: The password contains '@', so use the URL-encoded version directly:
pg_dump "postgresql://postgres:NSS%402025-26@db.uydgxhemdgsyowhxdyfk.supabase.co:5432/postgres" \
  --no-owner \
  --no-privileges \
  -f "backup_$(date +%Y%m%d_%H%M%S).sql"
```

Verify the backup file was created and is not empty:

```bash
ls -lh backup_*.sql
# Should be at least a few hundred KB
```

### Option B: Supabase Dashboard

1. Go to your Supabase project → Settings → Database
2. Click Backups → Download latest backup
3. Save the file locally

### How to restore (if needed)

```bash
psql "$DIRECT_URL" -f backup_YYYYMMDD_HHMMSS.sql
```

---

## Phase 1: Better Auth Setup (on existing Supabase DB)

### Step 1.1 — Generate auth secret

```bash
openssl rand -base64 32
```

Copy the output. This is your `BETTER_AUTH_SECRET`.

### Step 1.2 — Update `.env.local`

Open `.env.local` and add these two lines:

```env
BETTER_AUTH_SECRET=<paste the secret from step 1.1>
BETTER_AUTH_URL=http://localhost:3000
```

You can remove the old Supabase auth vars (they are no longer used):

```env
# DELETE THESE LINES (no code references them anymore):
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Your `.env.local` should now look like:

```env
DIRECT_URL=postgresql://postgres:NSS@2025-26@db.uydgxhemdgsyowhxdyfk.supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres.uydgxhemdgsyowhxdyfk:NSS%402025-26@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres

BETTER_AUTH_SECRET=<your-generated-secret>
BETTER_AUTH_URL=http://localhost:3000

UPSTASH_REDIS_REST_URL=https://heroic-goat-64642.upstash.io
UPSTASH_REDIS_REST_TOKEN=AfyCAAIncDE5MmZlY2EwYTkwYjY0ODI1YTZlYTJhNTUxMGZhNjBlZHAxNjQ2NDI
```

### Step 1.3 — Run database migrations

```bash
npm run db:migrate
```

Expected output:

```
Found 2 pending migration(s):

  ⏳ 0007_better_auth.sql
  ⏳ 0008_auth_user_id_text.sql

▶ Running 0007_better_auth.sql...
  ✅ 0007_better_auth.sql applied successfully
▶ Running 0008_auth_user_id_text.sql...
  ✅ 0008_auth_user_id_text.sql applied successfully
```

**What these migrations do:**
- `0007` creates 4 new tables: `user`, `session`, `account`, `verification` (Better Auth's tables)
- `0008` changes `volunteers.auth_user_id` from `UUID` to `TEXT` (Better Auth uses alphanumeric IDs, not UUIDs)

**Impact on existing data:** None. New tables are added. The column type change from UUID to TEXT is lossless — every valid UUID is valid TEXT.

### Step 1.4 — Verify migrations

```bash
npm run db:migrate:status
```

All 8 migrations should show `✅ applied`.

### Step 1.5 — Migrate existing users

This copies your users from Supabase's `auth.users` into Better Auth's tables, preserving their UUIDs and password hashes.

```bash
npx tsx scripts/migrate-supabase-users.ts
```

Expected output:

```
Starting Supabase Auth → Better Auth migration...

Found X users in auth.users
Found X email identities

Migration complete:
  Migrated: X
  Skipped (already exist): 0
  Errors: 0

All volunteers.auth_user_id values match Better Auth user table
```

**This script is idempotent** — running it again skips already-migrated users. Safe to re-run.

**What it does:**
1. Reads every user from `auth.users` (Supabase's internal auth schema)
2. Inserts each user into Better Auth's `user` table (same UUID as ID)
3. Copies their bcrypt password hash into the `account` table
4. Verifies all `volunteers.auth_user_id` references point to valid Better Auth users

### Step 1.6 — Test locally

```bash
npm run dev
```

Open `http://localhost:3000` and test:

| Test | Expected Result |
|------|----------------|
| Login with existing credentials | Works — same email + password |
| Navigate to `/dashboard` | Shows dashboard with correct user data |
| Navigate to `/settings` | Shows settings, DB provider card visible for admins |
| Sign out (header dropdown) | Redirects to `/login` |
| Sign out (Cmd+K → Sign Out) | Redirects to `/login` |
| Sign up with new user | Creates account, creates volunteer profile, redirects to `/dashboard` |
| Access `/dashboard` while logged out | Redirects to `/login` |
| Admin-only pages (non-admin user) | Redirects to `/dashboard` |

### Step 1.7 — Deploy to production

Update your production environment variables:

```bash
# If using Vercel:
vercel env add BETTER_AUTH_SECRET
vercel env add BETTER_AUTH_URL  # Set to your production URL, e.g. https://nss-app.vercel.app

# Remove old vars:
vercel env rm NEXT_PUBLIC_SUPABASE_URL
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Deploy:

```bash
git add -A
git commit -m "feat: migrate from Supabase Auth to Better Auth"
git push
```

**Let this run in production for at least a day before proceeding to Phase 2.** Confirm login/signup/signout all work in production.

---

## Phase 2: Neon DB Setup (Standby)

> Only proceed here after Phase 1 is stable in production.

### Step 2.1 — Create Neon project

1. Go to [neon.tech](https://neon.tech) → Sign up / Log in
2. Create a new project:
   - **Name:** `nss-app-standby`
   - **Region:** Asia Pacific (Tokyo) — match your Supabase region
   - **Postgres version:** 15 or 16
3. From the dashboard, copy your connection string

### Step 2.2 — Add Neon env vars to `.env.local`

```env
NEON_DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
NEON_DIRECT_URL=postgresql://neondb_owner:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

> Neon doesn't use a separate pooler URL by default. If you enable connection pooling in Neon's dashboard, use the pooled URL for `NEON_DATABASE_URL` and the direct URL for `NEON_DIRECT_URL`.

### Step 2.3 — Create schema on Neon

Neon starts with an empty database. Dump your Supabase schema (structure only, no data) and apply it to Neon:

```bash
# Load env vars
source <(grep -v '^#' .env.local | sed 's/^/export /')

# Dump schema only from Supabase
pg_dump "$DIRECT_URL" \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  -f neon_schema.sql

# Apply schema to Neon
psql "$NEON_DIRECT_URL" -f neon_schema.sql
```

### Step 2.4 — Seed the migrations table on Neon

Since we applied the schema directly (not through the migration runner), we need to tell the migration runner that all migrations are already applied:

```bash
psql "$NEON_DIRECT_URL" -c "
INSERT INTO _migrations (filename) VALUES
  ('0001_setup.sql'),
  ('0002_schema_cleanup.sql'),
  ('0003_auth_auto_link.sql'),
  ('0004_rls_policies.sql'),
  ('0005_audit_logs.sql'),
  ('0006_audit_logs_rls.sql'),
  ('0007_better_auth.sql'),
  ('0008_auth_user_id_text.sql')
ON CONFLICT (filename) DO NOTHING;
"
```

### Step 2.5 — Sync data from Supabase to Neon

```bash
npx tsx scripts/sync-databases.ts supabase-to-neon
```

Expected output:

```
Syncing: Supabase → Neon
[1/3] Dumping Supabase...
[2/3] Cleaning Neon public tables...
[3/3] Restoring to Neon...
Sync complete: Supabase → Neon
```

### Step 2.6 — Verify data on Neon

```bash
# Compare row counts
echo "=== Supabase ==="
psql "$DIRECT_URL" -c "SELECT 'volunteers' as t, COUNT(*) FROM volunteers UNION ALL SELECT 'events', COUNT(*) FROM events UNION ALL SELECT 'user', COUNT(*) FROM \"user\";"

echo "=== Neon ==="
psql "$NEON_DIRECT_URL" -c "SELECT 'volunteers' as t, COUNT(*) FROM volunteers UNION ALL SELECT 'events', COUNT(*) FROM events UNION ALL SELECT 'user', COUNT(*) FROM \"user\";"
```

Counts should match exactly.

### Step 2.7 — Test failover locally

```bash
npm run dev
```

1. Log in normally (using Supabase — the default)
2. Go to `/settings` (must be admin)
3. You should see the **Database Provider** card showing:
   - Active Provider: `supabase`
   - Connection Health for both databases (green checkmarks)
4. Click **"Switch to neon"** → Confirm in the dialog
5. Navigate around — all pages should work identically
6. Click **"Switch to supabase"** → Confirm
7. Everything works as before

**Important:** When you switch databases, all active sessions are lost (sessions are stored in the database). Users will need to log in again. This is expected behavior.

### Step 2.8 — Deploy with Neon support

Add the Neon env vars to production:

```bash
# If using Vercel:
vercel env add NEON_DATABASE_URL
vercel env add NEON_DIRECT_URL
```

Deploy. The app will start in single-DB mode (Supabase) by default. Neon is available as a failover target from the admin settings.

---

## Phase 3: Ongoing Operations

### Running future migrations

New migrations must be applied to BOTH databases:

```bash
# Apply to Supabase (default)
npm run db:migrate

# Apply to Neon
DATABASE_URL=$NEON_DIRECT_URL npm run db:migrate
```

**Always run migrations on both DBs BEFORE syncing data.** Schema must match for the sync to work.

### Syncing data between databases

```bash
# Supabase → Neon (most common — keep standby up to date)
npx tsx scripts/sync-databases.ts supabase-to-neon

# Neon → Supabase (after running on Neon for a while, sync back)
npx tsx scripts/sync-databases.ts neon-to-supabase
```

**How often to sync:**
- For disaster recovery (can tolerate hours of data loss): sync daily
- For tighter RPO: sync every few hours via cron
- For near-zero data loss: set up PostgreSQL logical replication (separate project)

### Emergency failover procedure

If Supabase goes down:

1. Go to Settings → Database Provider (or use Redis CLI)
2. Switch to `neon`
3. All queries now go to Neon
4. Users will need to re-login (sessions were in Supabase's DB)

Via Redis CLI (if the app UI is also down):

```bash
# Direct Redis command to switch
curl -X POST "https://heroic-goat-64642.upstash.io/set/nss:active_db/neon" \
  -H "Authorization: Bearer AfyCAAIncDE5MmZlY2EwYTkwYjY0ODI1YTZlYTJhNTUxMGZhNjBlZHAxNjQ2NDI"
```

To switch back:

```bash
curl -X POST "https://heroic-goat-64642.upstash.io/set/nss:active_db/supabase" \
  -H "Authorization: Bearer AfyCAAIncDE5MmZlY2EwYTkwYjY0ODI1YTZlYTJhNTUxMGZhNjBlZHAxNjQ2NDI"
```

### Production checklist for Better Auth

- [ ] `BETTER_AUTH_SECRET` is set (32+ chars, unique per environment)
- [ ] `BETTER_AUTH_URL` is set to your production domain
- [ ] Password reset emails work (requires email provider config — see below)
- [ ] Rate limiting on `/api/auth/*` routes (recommended)
- [ ] Session cleanup: periodically delete expired sessions

### Email provider for password resets (future task)

Better Auth needs an email provider to send password reset links. Without it, the forgot password flow won't send emails. To configure:

1. Sign up for [Resend](https://resend.com) (free tier: 3000 emails/month)
2. Get an API key
3. Add to `src/lib/auth.ts`:

```typescript
import { betterAuth } from 'better-auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  // ... existing config ...
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: 'NSS App <noreply@yourdomain.com>',
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
      })
    },
  },
})
```

4. Add `RESEND_API_KEY` to `.env.local` and production env vars.

---

## Rollback Plan

If Better Auth causes issues in production and you need to go back to Supabase Auth:

1. Restore from backup: `psql "$DIRECT_URL" -f backup_YYYYMMDD_HHMMSS.sql`
2. Revert the git commit: `git revert <commit-hash>`
3. Re-add Supabase env vars to production
4. Re-install Supabase packages: `npm install @supabase/ssr @supabase/supabase-js`
5. Deploy

The backup from Phase 0 contains the original schema (UUID column, no Better Auth tables). Restoring it puts everything back to the pre-migration state.

---

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Better Auth server config |
| `src/lib/auth-client.ts` | Better Auth client (React hooks) |
| `src/app/api/auth/[...all]/route.ts` | Auth API endpoint |
| `src/db/schema/auth-schema.ts` | Drizzle schema for auth tables |
| `src/db/migrations/0007_better_auth.sql` | Migration: create auth tables |
| `src/db/migrations/0008_auth_user_id_text.sql` | Migration: UUID → TEXT for auth_user_id |
| `scripts/migrate-supabase-users.ts` | One-time: copy users from Supabase Auth |
| `scripts/sync-databases.ts` | Sync data between Supabase ↔ Neon |
| `src/lib/db-provider.ts` | Redis-based DB provider switching |
| `src/db/health.ts` | Connection health checks |
| `src/app/actions/admin/db-provider.ts` | Admin actions for DB switching |
| `src/components/settings/database-settings.tsx` | Admin UI for DB management |
| `.env.example` | Template for all required env vars |
