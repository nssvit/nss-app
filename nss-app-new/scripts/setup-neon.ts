/**
 * Setup Neon DB: Creates all tables, indexes, triggers from scratch.
 * No Supabase-specific stuff (no RLS, no auth.uid(), no Supabase triggers).
 *
 * Run: npx tsx scripts/setup-neon.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import postgres from 'postgres'

const neonUrl = process.env.NEON_DIRECT_URL
if (!neonUrl) {
  console.error('NEON_DIRECT_URL environment variable is required')
  process.exit(1)
}

const sql = postgres(neonUrl, { prepare: false, max: 1 })

const SETUP_SQL = `
-- ============================================================
-- NSS App: Neon DB Setup (tables + indexes + triggers)
-- ============================================================

BEGIN;

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- HELPER: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLE: volunteers
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  roll_number TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  branch TEXT NOT NULL CHECK (branch IN ('EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC')),
  year TEXT NOT NULL CHECK (year IN ('FE', 'SE', 'TE')),
  phone_no TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IS NULL OR gender IN ('M', 'F', 'Prefer not to say')),
  nss_join_year INTEGER,
  address TEXT,
  profile_pic TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteers_auth_user ON volunteers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_branch ON volunteers(branch);
CREATE INDEX IF NOT EXISTS idx_volunteers_year ON volunteers(year);
CREATE INDEX IF NOT EXISTS idx_volunteers_active ON volunteers(is_active);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_roll_number ON volunteers(roll_number);

DROP TRIGGER IF EXISTS set_updated_at ON volunteers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON volunteers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: role_definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS role_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  hierarchy_level INTEGER NOT NULL DEFAULT 0 CHECK (hierarchy_level >= 0 AND hierarchy_level <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_active ON role_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy ON role_definitions(hierarchy_level);

DROP TRIGGER IF EXISTS set_updated_at ON role_definitions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON role_definitions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: user_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  role_definition_id UUID NOT NULL REFERENCES role_definitions(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES volunteers(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_volunteer ON user_roles(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_definition_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique ON user_roles(volunteer_id, role_definition_id);

DROP TRIGGER IF EXISTS set_updated_at ON user_roles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: event_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS event_categories (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  color_hex TEXT DEFAULT '#6366F1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON event_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_code ON event_categories(code);

DROP TRIGGER IF EXISTS set_updated_at ON event_categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON event_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: events
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  declared_hours INTEGER NOT NULL CHECK (declared_hours >= 1 AND declared_hours <= 240),
  category_id INTEGER NOT NULL REFERENCES event_categories(id),
  min_participants INTEGER,
  max_participants INTEGER CHECK (max_participants IS NULL OR max_participants >= COALESCE(min_participants, 0)),
  event_status TEXT NOT NULL DEFAULT 'planned' CHECK (event_status IN ('planned', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled')),
  location TEXT,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  created_by_volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT events_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(event_status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by_volunteer_id);

DROP TRIGGER IF EXISTS set_updated_at ON events;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: event_participation
-- ============================================================
CREATE TABLE IF NOT EXISTS event_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  hours_attended INTEGER NOT NULL DEFAULT 0 CHECK (hours_attended >= 0 AND hours_attended <= 24),
  approved_hours INTEGER CHECK (approved_hours IS NULL OR (approved_hours >= 0 AND approved_hours <= 24)),
  participation_status TEXT NOT NULL DEFAULT 'registered' CHECK (participation_status IN ('registered', 'present', 'absent', 'partially_present', 'excused')),
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attendance_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  feedback TEXT,
  recorded_by_volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES volunteers(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participation_event ON event_participation(event_id);
CREATE INDEX IF NOT EXISTS idx_participation_volunteer ON event_participation(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_participation_status ON event_participation(participation_status);
CREATE INDEX IF NOT EXISTS idx_participation_approval_status ON event_participation(approval_status);
CREATE INDEX IF NOT EXISTS idx_participation_approved_by ON event_participation(approved_by);
CREATE UNIQUE INDEX IF NOT EXISTS idx_participation_unique ON event_participation(event_id, volunteer_id);

DROP TRIGGER IF EXISTS set_updated_at ON event_participation;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON event_participation
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES volunteers(id),
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- Better Auth tables
-- ============================================================
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  id_token TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"(user_id);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"(identifier);

-- ============================================================
-- Migrations tracking table (so the app migration runner skips these)
-- ============================================================
CREATE TABLE IF NOT EXISTS _migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

COMMIT;
`

async function main() {
  console.log('🚀 Setting up Neon DB schema...\n')

  try {
    await sql.unsafe(SETUP_SQL)
    console.log('✅ All tables, indexes, and triggers created successfully!')

    // Verify tables
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    console.log(`\n📋 Tables in Neon (${tables.length}):`)
    for (const t of tables) {
      console.log(`   • ${t.tablename}`)
    }
  } catch (err) {
    console.error('❌ Setup failed:', err)
    process.exit(1)
  }

  await sql.end()
}

main()
