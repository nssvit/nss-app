-- ============================================================
-- NSS APP - SCHEMA FIXES (002)
-- Fixes for column name mismatches between functions and tables
-- Run this AFTER 001_complete_setup.sql
-- ============================================================

-- ============================================================
-- PART 1: DROP ALL CUSTOM FUNCTIONS FIRST
-- ============================================================

DROP FUNCTION IF EXISTS get_events_with_stats();
DROP FUNCTION IF EXISTS get_current_volunteer();
DROP FUNCTION IF EXISTS get_volunteer_participation_history(UUID);
DROP FUNCTION IF EXISTS get_pending_approvals_count();
DROP FUNCTION IF EXISTS approve_hours(UUID, UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS reject_hours(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS bulk_approve_hours(UUID[], UUID, TEXT);
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS admin_delete_volunteer(UUID);
DROP FUNCTION IF EXISTS admin_update_volunteer(UUID, JSONB);
DROP FUNCTION IF EXISTS admin_assign_role(UUID, TEXT);
DROP FUNCTION IF EXISTS admin_revoke_role(UUID, TEXT);


-- ============================================================
-- PART 2: GET EVENTS WITH STATS
-- Matches events table: event_name, event_date (timestamptz),
-- declared_hours, created_by_volunteer_id
-- ============================================================

CREATE OR REPLACE FUNCTION get_events_with_stats()
RETURNS TABLE (
  id UUID,
  event_name TEXT,
  event_description TEXT,
  event_date TIMESTAMPTZ,
  declared_hours INTEGER,
  category_name TEXT,
  created_by_name TEXT,
  participant_count BIGINT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.event_name,
    e.description as event_description,
    e.event_date,
    e.declared_hours,
    ec.category_name,
    COALESCE(v.first_name || ' ' || v.last_name, 'Unknown') as created_by_name,
    COUNT(ep.id) as participant_count,
    COALESCE(e.is_active, true) as is_active,
    e.created_at
  FROM events e
  LEFT JOIN event_categories ec ON ec.id = e.category_id
  LEFT JOIN volunteers v ON v.id = e.created_by_volunteer_id
  LEFT JOIN event_participation ep ON ep.event_id = e.id
  GROUP BY e.id, ec.category_name, v.first_name, v.last_name
  ORDER BY e.event_date DESC;
END;
$$;


-- ============================================================
-- PART 3: GET CURRENT VOLUNTEER
-- Matches volunteers table structure
-- ============================================================

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
    v.email::TEXT,
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


-- ============================================================
-- PART 4: GET VOLUNTEER PARTICIPATION HISTORY
-- Matches event_participation table: registration_date (not registered_at)
-- ============================================================

CREATE OR REPLACE FUNCTION get_volunteer_participation_history(p_volunteer_id UUID DEFAULT NULL)
RETURNS TABLE (
  participation_id UUID,
  event_id UUID,
  event_title TEXT,
  event_date TIMESTAMPTZ,
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
  IF p_volunteer_id IS NULL THEN
    SELECT id INTO v_volunteer_id FROM volunteers WHERE auth_user_id = auth.uid();
  ELSE
    v_volunteer_id := p_volunteer_id;
  END IF;

  RETURN QUERY
  SELECT
    ep.id as participation_id,
    e.id as event_id,
    e.event_name as event_title,
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


-- ============================================================
-- PART 5: HOURS APPROVAL FUNCTIONS
-- ============================================================

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


-- ============================================================
-- PART 6: ADMIN FUNCTIONS
-- ============================================================

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

CREATE OR REPLACE FUNCTION admin_delete_volunteer(p_volunteer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_volunteer_email TEXT;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  SELECT auth_user_id, email::TEXT INTO v_auth_user_id, v_volunteer_email
  FROM volunteers WHERE id = p_volunteer_id;

  IF v_auth_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Volunteer not found');
  END IF;

  DELETE FROM event_participation WHERE volunteer_id = p_volunteer_id;
  DELETE FROM user_roles WHERE volunteer_id = p_volunteer_id;
  DELETE FROM volunteers WHERE id = p_volunteer_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_volunteer_id', p_volunteer_id,
    'deleted_email', v_volunteer_email,
    'auth_user_id', v_auth_user_id,
    'note', 'Auth user must be deleted separately via Supabase Dashboard'
  );
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_volunteer(p_volunteer_id UUID, p_updates JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_volunteer_exists BOOLEAN;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  SELECT EXISTS(SELECT 1 FROM volunteers WHERE id = p_volunteer_id) INTO v_volunteer_exists;

  IF NOT v_volunteer_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Volunteer not found');
  END IF;

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

  RETURN jsonb_build_object('success', true, 'updated_volunteer_id', p_volunteer_id);
END;
$$;

CREATE OR REPLACE FUNCTION admin_assign_role(p_volunteer_id UUID, p_role_name TEXT)
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

  SELECT id INTO v_role_id FROM role_definitions WHERE role_name = p_role_name AND is_active = true;

  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Role not found: ' || p_role_name);
  END IF;

  INSERT INTO user_roles (volunteer_id, role_definition_id, is_active)
  VALUES (p_volunteer_id, v_role_id, true)
  ON CONFLICT (volunteer_id, role_definition_id)
  DO UPDATE SET is_active = true, updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'volunteer_id', p_volunteer_id, 'role_assigned', p_role_name);
END;
$$;

CREATE OR REPLACE FUNCTION admin_revoke_role(p_volunteer_id UUID, p_role_name TEXT)
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

  UPDATE user_roles
  SET is_active = false, updated_at = NOW()
  WHERE volunteer_id = p_volunteer_id AND role_definition_id = v_role_id;

  RETURN jsonb_build_object('success', true, 'volunteer_id', p_volunteer_id, 'role_revoked', p_role_name);
END;
$$;


-- ============================================================
-- PART 7: GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION get_events_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_volunteer() TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteer_participation_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_approvals_count() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_hours(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_hours(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_approve_hours(UUID[], UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_volunteer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_volunteer(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_assign_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_role(UUID, TEXT) TO authenticated;


-- ============================================================
-- VERIFICATION
-- ============================================================
-- Run these to verify:
-- SELECT * FROM get_events_with_stats() LIMIT 5;
-- SELECT * FROM get_current_volunteer();
-- SELECT get_pending_approvals_count();
