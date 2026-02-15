-- ============================================================
-- Migration 0004: RLS Policy Tightening
-- ============================================================
--
-- Replaces the 18 permissive placeholder policies (all "true")
-- with 25 proper policies that mirror the server-action auth gates.
--
-- IMPORTANT: These policies only affect the Supabase client path
-- (anon key + JWT). Drizzle ORM queries (all server actions) use
-- DATABASE_URL with postgres role credentials and bypass RLS entirely.
-- SECURITY DEFINER functions (handle_new_user, merge_volunteers, etc.)
-- also bypass RLS. This migration is purely additive defense-in-depth.
-- ============================================================


-- ============================================================
-- PART 1: FIX HELPER FUNCTIONS (add expires_at check)
-- ============================================================

-- The existing is_admin() and has_role() only check ur.is_active = true
-- but NOT expires_at. The app code checks both (see roleIsActiveAndNotExpired
-- in src/db/queries/roles.ts:11-14). Update both to match.

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
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

CREATE OR REPLACE FUNCTION public.has_role(p_role_name TEXT, p_user_id UUID DEFAULT auth.uid())
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

-- New convenience function: avoids repeating (is_admin() OR has_role('head'))
-- in every events/attendance policy. Single 3-table JOIN instead of two.
CREATE OR REPLACE FUNCTION public.is_admin_or_head(p_user_id UUID DEFAULT auth.uid())
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

GRANT EXECUTE ON FUNCTION public.is_admin_or_head(UUID) TO authenticated;


-- ============================================================
-- PART 2: DROP ALL 18 EXISTING PLACEHOLDER POLICIES
-- ============================================================

-- volunteers (4)
DROP POLICY IF EXISTS "volunteers_select" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_insert" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_update" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_delete" ON public.volunteers;

-- user_roles (4)
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;

-- role_definitions (1)
DROP POLICY IF EXISTS "role_definitions_select" ON public.role_definitions;

-- events (4)
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;

-- event_categories (4)
DROP POLICY IF EXISTS "event_categories_select" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_insert" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_update" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_delete" ON public.event_categories;

-- event_participation (4)
DROP POLICY IF EXISTS "event_participation_select" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_insert" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_update" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_delete" ON public.event_participation;


-- ============================================================
-- PART 3: CREATE 25 NEW POLICIES
-- ============================================================

-- -------------------------------------------------------
-- VOLUNTEERS (4 policies)
-- -------------------------------------------------------

-- SELECT: all authenticated users can read (auth-context.tsx needs this)
CREATE POLICY "volunteers_select"
  ON public.volunteers FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: blocked — only handle_new_user() trigger (SECURITY DEFINER) creates volunteers
CREATE POLICY "volunteers_insert"
  ON public.volunteers FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- UPDATE: own profile (auth_user_id matches) OR admin can edit anyone
CREATE POLICY "volunteers_update"
  ON public.volunteers FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid() OR is_admin())
  WITH CHECK (auth_user_id = auth.uid() OR is_admin());

-- DELETE: blocked — app uses soft-delete (is_active = false)
CREATE POLICY "volunteers_delete"
  ON public.volunteers FOR DELETE
  TO authenticated
  USING (false);


-- -------------------------------------------------------
-- USER_ROLES (4 policies)
-- -------------------------------------------------------

-- SELECT: all authenticated users can read (auth-context.tsx fetches roles)
CREATE POLICY "user_roles_select"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin only (assignRole → requireAdmin())
CREATE POLICY "user_roles_insert"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE: admin only (revokeRole → requireAdmin(), sets is_active = false)
CREATE POLICY "user_roles_update"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: blocked — app uses soft-delete (is_active = false)
CREATE POLICY "user_roles_delete"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false);


-- -------------------------------------------------------
-- ROLE_DEFINITIONS (4 policies)
-- -------------------------------------------------------

-- SELECT: all authenticated users can read (role dropdowns, auth checks)
CREATE POLICY "role_definitions_select"
  ON public.role_definitions FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin only (createRoleDefinition → requireAdmin())
CREATE POLICY "role_definitions_insert"
  ON public.role_definitions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE: admin only (updateRoleDefinition → requireAdmin())
CREATE POLICY "role_definitions_update"
  ON public.role_definitions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: blocked — no hard deletes in the app
CREATE POLICY "role_definitions_delete"
  ON public.role_definitions FOR DELETE
  TO authenticated
  USING (false);


-- -------------------------------------------------------
-- EVENTS (4 policies)
-- -------------------------------------------------------

-- SELECT: all authenticated users can read events
CREATE POLICY "events_select"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin or head (createEvent → requireAnyRole('admin','head'))
CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_head());

-- UPDATE: admin or head (updateEvent/deleteEvent soft-delete)
CREATE POLICY "events_update"
  ON public.events FOR UPDATE
  TO authenticated
  USING (is_admin_or_head())
  WITH CHECK (is_admin_or_head());

-- DELETE: blocked — app uses soft-delete (is_active = false)
CREATE POLICY "events_delete"
  ON public.events FOR DELETE
  TO authenticated
  USING (false);


-- -------------------------------------------------------
-- EVENT_CATEGORIES (4 policies)
-- -------------------------------------------------------

-- SELECT: all authenticated users can read (dropdowns, filters)
CREATE POLICY "event_categories_select"
  ON public.event_categories FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin only (createCategory → requireAdmin())
CREATE POLICY "event_categories_insert"
  ON public.event_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE: admin only (updateCategory → requireAdmin())
CREATE POLICY "event_categories_update"
  ON public.event_categories FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: blocked — app uses soft-delete (is_active = false)
CREATE POLICY "event_categories_delete"
  ON public.event_categories FOR DELETE
  TO authenticated
  USING (false);


-- -------------------------------------------------------
-- EVENT_PARTICIPATION (5 policies)
-- -------------------------------------------------------

-- SELECT: all authenticated users can read participation records
CREATE POLICY "event_participation_select"
  ON public.event_participation FOR SELECT
  TO authenticated
  USING (true);

-- INSERT (self): volunteers can register themselves for events
-- registerForEvent → getCurrentVolunteer() — uses own volunteer_id
CREATE POLICY "event_participation_insert_self"
  ON public.event_participation FOR INSERT
  TO authenticated
  WITH CHECK (volunteer_id = get_current_volunteer_id());

-- INSERT (admin/head): admins and heads can register any volunteer
-- addVolunteersToEvent, bulk operations
-- NOTE: PostgreSQL ORs all permissive policies for the same operation,
-- so a user matching EITHER _insert_self OR _insert_admin can INSERT.
CREATE POLICY "event_participation_insert_admin"
  ON public.event_participation FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_head());

-- UPDATE: admin or head (attendance marking, hours approval)
CREATE POLICY "event_participation_update"
  ON public.event_participation FOR UPDATE
  TO authenticated
  USING (is_admin_or_head())
  WITH CHECK (is_admin_or_head());

-- DELETE: blocked — syncAttendance DELETEs via Drizzle (bypasses RLS)
CREATE POLICY "event_participation_delete"
  ON public.event_participation FOR DELETE
  TO authenticated
  USING (false);
