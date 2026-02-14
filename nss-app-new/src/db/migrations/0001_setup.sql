-- ============================================================
-- NSS APP - AUTH, RLS & ADMIN FUNCTIONS
-- Migration: 0001_auth_and_rls.sql
--
-- This migration sets up:
--   1. Auth trigger (links auth.users -> volunteers)
--   2. Auth delete trigger (soft-deletes on auth user deletion)
--   3. RLS policies for all tables
--   4. Helper functions (is_admin, has_role, etc.)
--   5. Admin functions (CRUD operations)
--   6. Auto-update triggers for updated_at
--
-- Run via: npm run db:setup
-- ============================================================


-- ============================================================
-- PART 1: AUTH SIGNUP TRIGGER
-- Creates volunteer record when user signs up
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_volunteer_id UUID;
  v_role_id UUID;
BEGIN
  INSERT INTO public.volunteers (
    auth_user_id,
    email,
    first_name,
    last_name,
    roll_number,
    branch,
    year,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'roll_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', 'CMPN'),
    COALESCE(NEW.raw_user_meta_data->>'year', 'SE'),
    true
  )
  ON CONFLICT (auth_user_id) DO NOTHING
  RETURNING id INTO v_volunteer_id;

  IF v_volunteer_id IS NOT NULL THEN
    SELECT id INTO v_role_id
    FROM public.role_definitions
    WHERE role_name = 'volunteer' AND is_active = true
    LIMIT 1;

    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (volunteer_id, role_definition_id, is_active)
      VALUES (v_volunteer_id, v_role_id, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.volunteers TO supabase_auth_admin;
GRANT ALL ON public.user_roles TO supabase_auth_admin;
GRANT SELECT ON public.role_definitions TO supabase_auth_admin;


-- ============================================================
-- PART 2: AUTH DELETE TRIGGER
-- Soft-deletes volunteer when auth user is deleted
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.volunteers
  SET is_active = false,
      auth_user_id = NULL,
      updated_at = NOW()
  WHERE auth_user_id = OLD.id;

  UPDATE public.user_roles
  SET is_active = false,
      updated_at = NOW()
  WHERE volunteer_id IN (
    SELECT id FROM public.volunteers WHERE auth_user_id = OLD.id
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deleted();

GRANT EXECUTE ON FUNCTION public.handle_auth_user_deleted() TO supabase_auth_admin;


-- ============================================================
-- PART 3: RLS POLICIES
-- ============================================================

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "volunteers_select" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_insert" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_update" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_delete" ON public.volunteers;
CREATE POLICY "volunteers_select" ON public.volunteers FOR SELECT TO authenticated USING (true);
CREATE POLICY "volunteers_insert" ON public.volunteers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "volunteers_update" ON public.volunteers FOR UPDATE TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "volunteers_delete" ON public.volunteers FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated USING (false);
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "role_definitions_select" ON public.role_definitions;
CREATE POLICY "role_definitions_select" ON public.role_definitions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "event_categories_select" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_insert" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_update" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_delete" ON public.event_categories;
CREATE POLICY "event_categories_select" ON public.event_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_categories_insert" ON public.event_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "event_categories_update" ON public.event_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "event_categories_delete" ON public.event_categories FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;
CREATE POLICY "events_select" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "events_update" ON public.events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "events_delete" ON public.events FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "event_participation_select" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_insert" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_update" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_delete" ON public.event_participation;
CREATE POLICY "event_participation_select" ON public.event_participation FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_participation_insert" ON public.event_participation FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "event_participation_update" ON public.event_participation FOR UPDATE TO authenticated USING (true);
CREATE POLICY "event_participation_delete" ON public.event_participation FOR DELETE TO authenticated USING (true);


-- ============================================================
-- PART 4: HELPER FUNCTIONS
-- ============================================================

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
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_volunteer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM volunteers WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_volunteer_id() TO authenticated;


-- ============================================================
-- PART 5: ADMIN FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_delete_volunteer(p_volunteer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_email TEXT;
  v_deleted_participation INT;
  v_deleted_roles INT;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  SELECT auth_user_id, email INTO v_auth_user_id, v_email
  FROM volunteers WHERE id = p_volunteer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Volunteer not found');
  END IF;

  DELETE FROM event_participation WHERE volunteer_id = p_volunteer_id;
  GET DIAGNOSTICS v_deleted_participation = ROW_COUNT;

  DELETE FROM user_roles WHERE volunteer_id = p_volunteer_id;
  GET DIAGNOSTICS v_deleted_roles = ROW_COUNT;

  DELETE FROM volunteers WHERE id = p_volunteer_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_volunteer_id', p_volunteer_id,
    'deleted_email', v_email,
    'deleted_participation_records', v_deleted_participation,
    'deleted_role_assignments', v_deleted_roles,
    'auth_user_id', v_auth_user_id,
    'note', 'Auth user must be deleted separately via Supabase Dashboard or Admin API'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_deactivate_volunteer(p_volunteer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  UPDATE volunteers SET is_active = false, updated_at = NOW()
  WHERE id = p_volunteer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Volunteer not found');
  END IF;

  UPDATE user_roles SET is_active = false, updated_at = NOW()
  WHERE volunteer_id = p_volunteer_id;

  RETURN jsonb_build_object('success', true, 'deactivated_volunteer_id', p_volunteer_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reactivate_volunteer(p_volunteer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  UPDATE volunteers SET is_active = true, updated_at = NOW()
  WHERE id = p_volunteer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Volunteer not found');
  END IF;

  UPDATE user_roles SET is_active = true, updated_at = NOW()
  WHERE volunteer_id = p_volunteer_id;

  RETURN jsonb_build_object('success', true, 'reactivated_volunteer_id', p_volunteer_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_assign_role(p_volunteer_id UUID, p_role_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_id UUID;
  v_existing UUID;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  SELECT id INTO v_role_id FROM role_definitions WHERE role_name = p_role_name AND is_active = true;
  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Role not found: ' || p_role_name);
  END IF;

  SELECT id INTO v_existing FROM user_roles
  WHERE volunteer_id = p_volunteer_id AND role_definition_id = v_role_id;

  IF v_existing IS NOT NULL THEN
    UPDATE user_roles SET is_active = true, updated_at = NOW() WHERE id = v_existing;
  ELSE
    INSERT INTO user_roles (volunteer_id, role_definition_id, assigned_by, is_active)
    VALUES (p_volunteer_id, v_role_id, get_current_volunteer_id(), true);
  END IF;

  RETURN jsonb_build_object('success', true, 'volunteer_id', p_volunteer_id, 'role_assigned', p_role_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(p_volunteer_id UUID, p_role_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  SELECT id INTO v_role_id FROM role_definitions WHERE role_name = p_role_name;
  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Role not found: ' || p_role_name);
  END IF;

  UPDATE user_roles SET is_active = false, updated_at = NOW()
  WHERE volunteer_id = p_volunteer_id AND role_definition_id = v_role_id;

  RETURN jsonb_build_object('success', true, 'volunteer_id', p_volunteer_id, 'role_revoked', p_role_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_verify_volunteer(p_volunteer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  UPDATE volunteers SET is_active = true, updated_at = NOW()
  WHERE id = p_volunteer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Volunteer not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'verified_volunteer_id', p_volunteer_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_volunteer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_deactivate_volunteer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reactivate_volunteer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_volunteer(UUID) TO authenticated;


-- ============================================================
-- PART 6: UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.volunteers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.volunteers FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.events;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.event_participation;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.event_participation FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.event_categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.event_categories FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.role_definitions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.role_definitions FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.user_roles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
-- ============================================================
-- NSS APP - SEED DATA
-- Migration: 0002_seed_data.sql
--
-- Seeds initial data:
--   1. Role definitions (admin, head, volunteer)
--   2. Event categories
--
-- Run via: npm run db:setup
-- ============================================================


-- ============================================================
-- PART 1: ROLE DEFINITIONS
-- ============================================================

INSERT INTO role_definitions (role_name, display_name, description, permissions, hierarchy_level, is_active)
VALUES
  (
    'admin',
    'Administrator',
    'System administrator with full access to all features',
    '{"users": ["read", "create", "update", "delete"], "events": ["read", "create", "update", "delete"], "roles": ["read", "create", "update", "delete"], "reports": ["read", "export"], "settings": ["read", "update"]}'::jsonb,
    100,
    true
  ),
  (
    'head',
    'NSS Head',
    'NSS Head with management capabilities for events and volunteers',
    '{"users": ["read", "update"], "events": ["read", "create", "update"], "roles": ["read"], "reports": ["read", "export"]}'::jsonb,
    50,
    true
  ),
  (
    'volunteer',
    'Volunteer',
    'Regular NSS volunteer with basic access',
    '{"users": ["read"], "events": ["read"], "reports": ["read"]}'::jsonb,
    10,
    true
  )
ON CONFLICT (role_name) DO NOTHING;


-- ============================================================
-- PART 2: EVENT CATEGORIES
-- ============================================================

INSERT INTO event_categories (category_name, code, description, color_hex, is_active)
VALUES
  ('Area Based - 1', 'area-based-1', 'Area-based community service activities (Group 1)', '#22C55E', true),
  ('Area Based - 2', 'area-based-2', 'Area-based community service activities (Group 2)', '#16A34A', true),
  ('University Based', 'university-based', 'University-level NSS events and programs', '#8B5CF6', true),
  ('College Based', 'college-based', 'College-level NSS events and activities', '#CA8A04', true)
ON CONFLICT (code) DO NOTHING;
