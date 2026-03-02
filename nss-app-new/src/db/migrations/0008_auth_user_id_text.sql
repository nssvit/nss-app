-- 0008: Change volunteers.auth_user_id from UUID to TEXT
--
-- Better Auth generates 32-char alphanumeric IDs, not UUIDs.
-- This migration changes the column type to accept both formats.
--
-- Problem: RLS policies depend on helper functions (is_admin, has_role,
-- is_admin_or_head, get_current_volunteer_id) which take UUID params and
-- compare against auth_user_id. The volunteers_update policy also directly
-- references auth_user_id. All must be dropped and recreated.
--
-- NOTE: auth.uid() is Supabase-specific. These policies are defense-in-depth
-- only — all authorization is enforced in server actions via Drizzle (which
-- bypasses RLS entirely).

BEGIN;

-- ============================================================
-- STEP 1: Drop ALL policies that depend on the helper functions
-- ============================================================

-- Depends on is_admin(UUID):
DROP POLICY IF EXISTS "volunteers_update" ON public.volunteers;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "role_definitions_insert" ON public.role_definitions;
DROP POLICY IF EXISTS "role_definitions_update" ON public.role_definitions;
DROP POLICY IF EXISTS "event_categories_insert" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_update" ON public.event_categories;
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;

-- Depends on is_admin_or_head(UUID):
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "event_participation_insert_admin" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_update" ON public.event_participation;

-- Depends on get_current_volunteer_id():
DROP POLICY IF EXISTS "event_participation_insert_self" ON public.event_participation;

-- ============================================================
-- STEP 2: Drop helper functions (UUID signatures)
-- ============================================================
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.has_role(TEXT, UUID);
DROP FUNCTION IF EXISTS public.is_admin_or_head(UUID);
DROP FUNCTION IF EXISTS public.get_current_volunteer_id();

-- ============================================================
-- STEP 3: Alter the column type
-- ============================================================
ALTER TABLE volunteers ALTER COLUMN auth_user_id TYPE TEXT USING auth_user_id::TEXT;

-- ============================================================
-- STEP 4: Recreate helper functions with TEXT-compatible params
-- auth.uid() returns UUID, cast to TEXT for comparison.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id TEXT DEFAULT auth.uid()::TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM volunteers v
    JOIN user_roles ur ON ur.volunteer_id = v.id
    JOIN role_definitions rd ON rd.id = ur.role_definition_id
    WHERE v.auth_user_id = p_user_id
      AND rd.role_name = 'admin'
      AND ur.is_active = true
      AND v.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(p_role_name TEXT, p_user_id TEXT DEFAULT auth.uid()::TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM volunteers v
    JOIN user_roles ur ON ur.volunteer_id = v.id
    JOIN role_definitions rd ON rd.id = ur.role_definition_id
    WHERE v.auth_user_id = p_user_id
      AND rd.role_name = p_role_name
      AND ur.is_active = true
      AND v.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_head(p_user_id TEXT DEFAULT auth.uid()::TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_current_volunteer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM volunteers WHERE auth_user_id = auth.uid()::TEXT LIMIT 1;
$$;

-- ============================================================
-- STEP 5: Re-grant permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION public.is_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_head(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_volunteer_id() TO authenticated;

-- ============================================================
-- STEP 6: Recreate ALL dropped policies
-- ============================================================

-- volunteers: own profile OR admin
CREATE POLICY "volunteers_update"
  ON public.volunteers FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid()::TEXT OR is_admin())
  WITH CHECK (auth_user_id = auth.uid()::TEXT OR is_admin());

-- user_roles: admin only
CREATE POLICY "user_roles_insert"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "user_roles_update"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- role_definitions: admin only
CREATE POLICY "role_definitions_insert"
  ON public.role_definitions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "role_definitions_update"
  ON public.role_definitions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- event_categories: admin only
CREATE POLICY "event_categories_insert"
  ON public.event_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "event_categories_update"
  ON public.event_categories FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- audit_logs: admin can view
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- events: admin or head
CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_head());

CREATE POLICY "events_update"
  ON public.events FOR UPDATE
  TO authenticated
  USING (is_admin_or_head())
  WITH CHECK (is_admin_or_head());

-- event_participation: self-register OR admin/head
CREATE POLICY "event_participation_insert_self"
  ON public.event_participation FOR INSERT
  TO authenticated
  WITH CHECK (volunteer_id = get_current_volunteer_id());

CREATE POLICY "event_participation_insert_admin"
  ON public.event_participation FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_head());

CREATE POLICY "event_participation_update"
  ON public.event_participation FOR UPDATE
  TO authenticated
  USING (is_admin_or_head())
  WITH CHECK (is_admin_or_head());

COMMIT;
