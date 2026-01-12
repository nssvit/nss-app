-- ============================================================
-- NSS APP - COMPLETE DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: HANDLE NEW USER SIGNUP (TRIGGER)
-- ============================================================

-- Create function to handle new user signup
-- Runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_volunteer_id UUID;
  v_role_id UUID;
BEGIN
  -- Create volunteer record from auth metadata
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

  -- If volunteer was created, assign default role
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

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions for trigger to work
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.volunteers TO supabase_auth_admin;
GRANT ALL ON public.user_roles TO supabase_auth_admin;
GRANT SELECT ON public.role_definitions TO supabase_auth_admin;


-- ============================================================
-- PART 2: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;

-- -----------------------------
-- VOLUNTEERS POLICIES
-- -----------------------------
DROP POLICY IF EXISTS "volunteers_select_policy" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_insert_policy" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_update_policy" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_delete_policy" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_own_records_only" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_select_own_or_admin" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_insert_own" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_update_own_or_admin" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_delete_admin_only" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_select" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_insert" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_update" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_delete" ON public.volunteers;

-- SELECT: Authenticated users can read all volunteers
CREATE POLICY "volunteers_select_policy" ON public.volunteers
FOR SELECT TO authenticated
USING (true);

-- INSERT: Authenticated users can insert (trigger handles signup)
CREATE POLICY "volunteers_insert_policy" ON public.volunteers
FOR INSERT TO authenticated
WITH CHECK (true);

-- UPDATE: Users can only update their own record
CREATE POLICY "volunteers_update_policy" ON public.volunteers
FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid());

-- DELETE: Only via admin functions (RPC)
CREATE POLICY "volunteers_delete_policy" ON public.volunteers
FOR DELETE TO authenticated
USING (false);

-- -----------------------------
-- USER_ROLES POLICIES
-- -----------------------------
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_own_only" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_system" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;

CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "user_roles_insert_policy" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "user_roles_update_policy" ON public.user_roles
FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "user_roles_delete_policy" ON public.user_roles
FOR DELETE TO authenticated
USING (false);

-- -----------------------------
-- ROLE_DEFINITIONS POLICIES
-- -----------------------------
DROP POLICY IF EXISTS "role_definitions_select_policy" ON public.role_definitions;
DROP POLICY IF EXISTS "role_definitions_read_all" ON public.role_definitions;
DROP POLICY IF EXISTS "role_definitions_select" ON public.role_definitions;

CREATE POLICY "role_definitions_select_policy" ON public.role_definitions
FOR SELECT TO authenticated
USING (true);

-- -----------------------------
-- EVENT_CATEGORIES POLICIES
-- -----------------------------
DROP POLICY IF EXISTS "event_categories_select_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_insert_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_update_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_delete_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_public_read" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_select" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_insert" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_update" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_delete" ON public.event_categories;

CREATE POLICY "event_categories_select_policy" ON public.event_categories
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "event_categories_insert_policy" ON public.event_categories
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "event_categories_update_policy" ON public.event_categories
FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "event_categories_delete_policy" ON public.event_categories
FOR DELETE TO authenticated
USING (true);

-- -----------------------------
-- EVENTS POLICIES
-- -----------------------------
DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;
DROP POLICY IF EXISTS "events_delete_policy" ON public.events;
DROP POLICY IF EXISTS "events_public_read" ON public.events;
DROP POLICY IF EXISTS "events_create_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_update_own" ON public.events;
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;

CREATE POLICY "events_select_policy" ON public.events
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "events_insert_policy" ON public.events
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "events_update_policy" ON public.events
FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "events_delete_policy" ON public.events
FOR DELETE TO authenticated
USING (true);

-- -----------------------------
-- EVENT_PARTICIPATION POLICIES
-- -----------------------------
DROP POLICY IF EXISTS "event_participation_select_policy" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_insert_policy" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_update_policy" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_delete_policy" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_own_records" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_select" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_insert" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_update" ON public.event_participation;
DROP POLICY IF EXISTS "event_participation_delete" ON public.event_participation;

CREATE POLICY "event_participation_select_policy" ON public.event_participation
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "event_participation_insert_policy" ON public.event_participation
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "event_participation_update_policy" ON public.event_participation
FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "event_participation_delete_policy" ON public.event_participation
FOR DELETE TO authenticated
USING (true);


-- ============================================================
-- PART 3: HOURS APPROVAL WORKFLOW
-- ============================================================

-- Add approval columns to event_participation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participation' AND column_name = 'approval_status') THEN
    ALTER TABLE event_participation ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participation' AND column_name = 'approved_by') THEN
    ALTER TABLE event_participation ADD COLUMN approved_by UUID REFERENCES volunteers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participation' AND column_name = 'approved_at') THEN
    ALTER TABLE event_participation ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participation' AND column_name = 'approval_notes') THEN
    ALTER TABLE event_participation ADD COLUMN approval_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participation' AND column_name = 'approved_hours') THEN
    ALTER TABLE event_participation ADD COLUMN approved_hours INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for approval queries
CREATE INDEX IF NOT EXISTS idx_event_participation_approval_status
ON event_participation(approval_status)
WHERE approval_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_event_participation_approved_by
ON event_participation(approved_by)
WHERE approved_by IS NOT NULL;

-- Add constraint for valid approval status (drop first if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'chk_approval_status') THEN
    ALTER TABLE event_participation ADD CONSTRAINT chk_approval_status
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Function: Get pending approvals count
CREATE OR REPLACE FUNCTION get_pending_approvals_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM event_participation
  WHERE approval_status = 'pending'
    AND participation_status IN ('attended', 'present', 'partial', 'partially_present')
    AND hours_attended > 0;
$$;

-- Function: Approve hours
CREATE OR REPLACE FUNCTION approve_hours(
  p_participation_id UUID,
  p_approved_by UUID,
  p_approved_hours INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hours_to_approve INTEGER;
BEGIN
  SELECT COALESCE(p_approved_hours, hours_attended) INTO v_hours_to_approve
  FROM event_participation
  WHERE id = p_participation_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE event_participation
  SET
    approval_status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW(),
    approved_hours = v_hours_to_approve,
    approval_notes = p_notes,
    updated_at = NOW()
  WHERE id = p_participation_id;

  RETURN TRUE;
END;
$$;

-- Function: Reject hours
CREATE OR REPLACE FUNCTION reject_hours(
  p_participation_id UUID,
  p_rejected_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE event_participation
  SET
    approval_status = 'rejected',
    approved_by = p_rejected_by,
    approved_at = NOW(),
    approved_hours = 0,
    approval_notes = p_notes,
    updated_at = NOW()
  WHERE id = p_participation_id;

  RETURN FOUND;
END;
$$;

-- Function: Bulk approve hours
CREATE OR REPLACE FUNCTION bulk_approve_hours(
  p_participation_ids UUID[],
  p_approved_by UUID,
  p_notes TEXT DEFAULT 'Bulk approved'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE event_participation
  SET
    approval_status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW(),
    approved_hours = hours_attended,
    approval_notes = p_notes,
    updated_at = NOW()
  WHERE id = ANY(p_participation_ids)
    AND approval_status = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Grant execute on approval functions
GRANT EXECUTE ON FUNCTION get_pending_approvals_count() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_hours(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_hours(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_approve_hours(UUID[], UUID, TEXT) TO authenticated;


-- ============================================================
-- PART 4: ADMIN OPERATIONS
-- ============================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID DEFAULT auth.uid())
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

-- Admin: Delete volunteer completely (including auth user)
CREATE OR REPLACE FUNCTION admin_delete_volunteer(p_volunteer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_volunteer_email TEXT;
  v_result JSONB;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;

  -- Get volunteer details
  SELECT auth_user_id, email INTO v_auth_user_id, v_volunteer_email
  FROM volunteers
  WHERE id = p_volunteer_id;

  IF v_auth_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Volunteer not found'
    );
  END IF;

  -- Delete in order (respecting foreign keys)
  DELETE FROM event_participation WHERE volunteer_id = p_volunteer_id;
  DELETE FROM user_roles WHERE volunteer_id = p_volunteer_id;
  DELETE FROM volunteers WHERE id = p_volunteer_id;

  -- Note: Cannot delete from auth.users directly via RPC
  -- The auth user will remain but be orphaned

  RETURN jsonb_build_object(
    'success', true,
    'deleted_volunteer_id', p_volunteer_id,
    'deleted_email', v_volunteer_email,
    'auth_user_id', v_auth_user_id,
    'note', 'Auth user must be deleted separately via Supabase Dashboard or Admin API'
  );
END;
$$;

-- Admin: Update any volunteer
CREATE OR REPLACE FUNCTION admin_update_volunteer(
  p_volunteer_id UUID,
  p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_volunteer_exists BOOLEAN;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;

  -- Check volunteer exists
  SELECT EXISTS(SELECT 1 FROM volunteers WHERE id = p_volunteer_id) INTO v_volunteer_exists;

  IF NOT v_volunteer_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Volunteer not found'
    );
  END IF;

  -- Update volunteer with provided fields
  UPDATE volunteers
  SET
    first_name = COALESCE(p_updates->>'first_name', first_name),
    last_name = COALESCE(p_updates->>'last_name', last_name),
    roll_number = COALESCE(p_updates->>'roll_number', roll_number),
    branch = COALESCE(p_updates->>'branch', branch),
    year = COALESCE(p_updates->>'year', year),
    phone_no = COALESCE(p_updates->>'phone_no', phone_no),
    is_active = COALESCE((p_updates->>'is_active')::boolean, is_active),
    updated_at = NOW()
  WHERE id = p_volunteer_id;

  RETURN jsonb_build_object(
    'success', true,
    'updated_volunteer_id', p_volunteer_id
  );
END;
$$;

-- Admin: Assign role to volunteer
CREATE OR REPLACE FUNCTION admin_assign_role(
  p_volunteer_id UUID,
  p_role_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;

  -- Get role definition
  SELECT id INTO v_role_id
  FROM role_definitions
  WHERE role_name = p_role_name AND is_active = true;

  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Role not found: ' || p_role_name
    );
  END IF;

  -- Insert or update role assignment
  INSERT INTO user_roles (volunteer_id, role_definition_id, is_active)
  VALUES (p_volunteer_id, v_role_id, true)
  ON CONFLICT (volunteer_id, role_definition_id)
  DO UPDATE SET is_active = true, updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'volunteer_id', p_volunteer_id,
    'role_assigned', p_role_name
  );
END;
$$;

-- Admin: Revoke role from volunteer
CREATE OR REPLACE FUNCTION admin_revoke_role(
  p_volunteer_id UUID,
  p_role_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;

  -- Get role definition
  SELECT id INTO v_role_id
  FROM role_definitions
  WHERE role_name = p_role_name;

  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Role not found: ' || p_role_name
    );
  END IF;

  -- Deactivate role assignment
  UPDATE user_roles
  SET is_active = false, updated_at = NOW()
  WHERE volunteer_id = p_volunteer_id AND role_definition_id = v_role_id;

  RETURN jsonb_build_object(
    'success', true,
    'volunteer_id', p_volunteer_id,
    'role_revoked', p_role_name
  );
END;
$$;

-- Grant execute on admin functions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_volunteer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_volunteer(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_assign_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_role(UUID, TEXT) TO authenticated;


-- ============================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================

-- Drop existing functions first (required when changing return types)
DROP FUNCTION IF EXISTS get_current_volunteer();
DROP FUNCTION IF EXISTS get_volunteer_participation_history(UUID);
DROP FUNCTION IF EXISTS get_events_with_stats();

-- Get current volunteer with roles
CREATE OR REPLACE FUNCTION get_current_volunteer()
RETURNS TABLE (
  volunteer_id UUID,
  first_name TEXT,
  last_name TEXT,
  roll_number TEXT,
  email TEXT,
  branch TEXT,
  year TEXT,
  phone_no TEXT,
  birth_date DATE,
  gender TEXT,
  nss_join_year INTEGER,
  address TEXT,
  profile_pic TEXT,
  is_active BOOLEAN,
  roles TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as volunteer_id,
    v.first_name,
    v.last_name,
    v.roll_number,
    v.email,
    v.branch,
    v.year,
    v.phone_no,
    v.birth_date,
    v.gender,
    v.nss_join_year,
    v.address,
    v.profile_pic,
    v.is_active,
    COALESCE(
      array_agg(rd.role_name) FILTER (WHERE rd.role_name IS NOT NULL),
      ARRAY['volunteer']::TEXT[]
    ) as roles
  FROM volunteers v
  LEFT JOIN user_roles ur ON ur.volunteer_id = v.id AND ur.is_active = true
  LEFT JOIN role_definitions rd ON rd.id = ur.role_definition_id AND rd.is_active = true
  WHERE v.auth_user_id = auth.uid()
    AND v.is_active = true
  GROUP BY v.id;
END;
$$;

-- Get volunteer participation history
CREATE OR REPLACE FUNCTION get_volunteer_participation_history(p_volunteer_id UUID DEFAULT NULL)
RETURNS TABLE (
  participation_id UUID,
  event_id UUID,
  event_title TEXT,
  event_date DATE,
  category_name TEXT,
  participation_status TEXT,
  hours_attended INTEGER,
  approved_hours INTEGER,
  approval_status TEXT,
  registration_date TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_volunteer_id UUID;
BEGIN
  -- Use provided ID or get current user's volunteer ID
  IF p_volunteer_id IS NULL THEN
    SELECT id INTO v_volunteer_id
    FROM volunteers
    WHERE auth_user_id = auth.uid();
  ELSE
    v_volunteer_id := p_volunteer_id;
  END IF;

  RETURN QUERY
  SELECT
    ep.id as participation_id,
    e.id as event_id,
    e.title as event_title,
    e.event_date,
    ec.category_name,
    ep.participation_status,
    ep.hours_attended,
    ep.approved_hours,
    ep.approval_status,
    ep.registration_date
  FROM event_participation ep
  JOIN events e ON e.id = ep.event_id
  LEFT JOIN event_categories ec ON ec.id = e.category_id
  WHERE ep.volunteer_id = v_volunteer_id
  ORDER BY e.event_date DESC;
END;
$$;

-- Get events with statistics
CREATE OR REPLACE FUNCTION get_events_with_stats()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  max_volunteers INTEGER,
  hours_awarded INTEGER,
  status TEXT,
  category_id UUID,
  category_name TEXT,
  category_color TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  registered_count BIGINT,
  attended_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.event_date,
    e.start_time,
    e.end_time,
    e.location,
    e.max_volunteers,
    e.hours_awarded,
    e.status,
    e.category_id,
    ec.category_name,
    ec.color as category_color,
    e.created_by,
    e.created_at,
    COUNT(ep.id) FILTER (WHERE ep.participation_status = 'registered') as registered_count,
    COUNT(ep.id) FILTER (WHERE ep.participation_status IN ('attended', 'present')) as attended_count
  FROM events e
  LEFT JOIN event_categories ec ON ec.id = e.category_id
  LEFT JOIN event_participation ep ON ep.event_id = e.id
  GROUP BY e.id, ec.category_name, ec.color
  ORDER BY e.event_date DESC;
END;
$$;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_current_volunteer() TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteer_participation_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_events_with_stats() TO authenticated;


-- ============================================================
-- PART 6: SEED DEFAULT DATA (if not exists)
-- ============================================================

-- Insert default role definitions
INSERT INTO role_definitions (role_name, display_name, description, hierarchy_level, is_active)
VALUES
  ('admin', 'Administrator', 'System administrator with full access', 100, true),
  ('head', 'NSS Head', 'NSS Head with management capabilities', 50, true),
  ('volunteer', 'Volunteer', 'Regular NSS volunteer', 10, true)
ON CONFLICT (role_name) DO NOTHING;

-- Add color column to event_categories if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_categories' AND column_name = 'color') THEN
    ALTER TABLE event_categories ADD COLUMN color TEXT DEFAULT '#6366F1';
  END IF;
END $$;

-- Add unique constraint on category_name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_categories_category_name_key') THEN
    ALTER TABLE event_categories ADD CONSTRAINT event_categories_category_name_key UNIQUE (category_name);
  END IF;
END $$;

-- Insert default event categories (without color - add column separately if needed)
INSERT INTO event_categories (category_name, code, description, is_active)
VALUES
  ('Community Service', 'community-service', 'Community outreach and service activities', true),
  ('Blood Donation', 'blood-donation', 'Blood donation camps and drives', true),
  ('Environmental', 'environmental', 'Environmental awareness and conservation', true),
  ('Health Camp', 'health-camp', 'Health awareness and medical camps', true),
  ('Education', 'education', 'Educational programs and literacy drives', true),
  ('Cleanliness Drive', 'cleanliness-drive', 'Swachh Bharat and cleanliness activities', true),
  ('Workshop', 'workshop', 'Skill development workshops', true),
  ('Cultural', 'cultural', 'Cultural events and celebrations', true)
ON CONFLICT (category_name) DO NOTHING;


-- ============================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================
-- SELECT schemaname, tablename, policyname, cmd, permissive FROM pg_policies WHERE schemaname = 'public';
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE event_object_schema IN ('public', 'auth');
-- SELECT * FROM role_definitions;
-- SELECT * FROM event_categories;
