-- ============================================================
-- Migration: 0003_auth_auto_link.sql
--
-- Updates the signup trigger to auto-link new auth users
-- to existing CSV-imported volunteer records (auth_user_id IS NULL).
--
-- Logic (priority order):
--   1. Match by email (exact, case-insensitive) — highest confidence
--   2. Match by first_name + last_name (case-insensitive, exactly 1 match)
--   3. If no match → create new volunteer (original behavior)
--   4. Edge cases (multiple name matches etc.) handled via admin merge
--
-- Also adds merge_volunteers() function for admin manual linking.
-- ============================================================


-- ────────────────────────────────────────────────────────────────
-- PART 1: Updated auth signup trigger with auto-linking
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_volunteer_id UUID;
  v_role_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
  v_new_roll TEXT;
  v_match_count INT;
BEGIN
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_new_roll   := COALESCE(NEW.raw_user_meta_data->>'roll_number', '');

  -- ── Step 1: Try EMAIL match (highest confidence) ──────────────
  -- Covers: admin already corrected the CSV email to match real one
  -- email column is UNIQUE so count is always 0 or 1
  SELECT COUNT(*) INTO v_match_count
  FROM public.volunteers
  WHERE auth_user_id IS NULL
    AND lower(trim(email)) = lower(trim(NEW.email));

  IF v_match_count = 1 THEN
    UPDATE public.volunteers
    SET auth_user_id = NEW.id,
        -- email already matches, no need to update it
        -- roll_number: only replace placeholder, and only if it won't conflict
        roll_number = CASE
          WHEN roll_number LIKE 'NSS%'
            AND v_new_roll <> ''
            AND NOT EXISTS (
              SELECT 1 FROM public.volunteers v2
              WHERE v2.roll_number = v_new_roll
            )
          THEN v_new_roll
          ELSE roll_number
        END,
        branch = COALESCE(NULLIF(NEW.raw_user_meta_data->>'branch', ''), branch),
        year   = COALESCE(NULLIF(NEW.raw_user_meta_data->>'year', ''), year),
        is_active = true,
        updated_at = NOW()
    WHERE auth_user_id IS NULL
      AND lower(trim(email)) = lower(trim(NEW.email))
    RETURNING id INTO v_volunteer_id;
  END IF;

  -- ── Step 2: Try NAME match (exactly 1 unlinked volunteer) ─────
  -- Covers: email differs (CSV has generated email) but name is unique
  IF v_volunteer_id IS NULL AND v_first_name <> '' AND v_last_name <> '' THEN
    SELECT COUNT(*) INTO v_match_count
    FROM public.volunteers
    WHERE auth_user_id IS NULL
      AND lower(trim(first_name)) = lower(trim(v_first_name))
      AND lower(trim(last_name))  = lower(trim(v_last_name));

    IF v_match_count = 1 THEN
      UPDATE public.volunteers
      SET auth_user_id = NEW.id,
          email = NEW.email,
          roll_number = CASE
            WHEN roll_number LIKE 'NSS%'
              AND v_new_roll <> ''
              AND NOT EXISTS (
                SELECT 1 FROM public.volunteers v2
                WHERE v2.roll_number = v_new_roll
              )
            THEN v_new_roll
            ELSE roll_number
          END,
          branch = COALESCE(NULLIF(NEW.raw_user_meta_data->>'branch', ''), branch),
          year   = COALESCE(NULLIF(NEW.raw_user_meta_data->>'year', ''), year),
          is_active = true,
          updated_at = NOW()
      WHERE auth_user_id IS NULL
        AND lower(trim(first_name)) = lower(trim(v_first_name))
        AND lower(trim(last_name))  = lower(trim(v_last_name))
      RETURNING id INTO v_volunteer_id;
    END IF;
    -- 0 or >1 name matches → fall through to create new
  END IF;

  -- ── Step 3: No match → create new volunteer ───────────────────
  -- Uses provided roll_number if unique, otherwise generates a safe placeholder
  IF v_volunteer_id IS NULL THEN
    INSERT INTO public.volunteers (
      auth_user_id, email, first_name, last_name,
      roll_number, branch, year, is_active
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_first_name,
      v_last_name,
      CASE
        WHEN v_new_roll <> ''
          AND NOT EXISTS (
            SELECT 1 FROM public.volunteers WHERE roll_number = v_new_roll
          )
        THEN v_new_roll
        ELSE 'NSS-' || substr(NEW.id::text, 1, 8)
      END,
      COALESCE(NEW.raw_user_meta_data->>'branch', 'CMPN'),
      COALESCE(NEW.raw_user_meta_data->>'year', 'SE'),
      true
    )
    ON CONFLICT (auth_user_id) DO NOTHING
    RETURNING id INTO v_volunteer_id;
  END IF;

  -- ── Step 4: Assign default volunteer role ──────────────────────
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


-- ────────────────────────────────────────────────────────────────
-- PART 2: Admin merge function
--
-- Merges an unlinked CSV volunteer (source) INTO an authenticated
-- volunteer (target). Transfers all participation + roles, then
-- deletes the source orphan.
--
-- Usage from app: SELECT merge_volunteers('target-uuid', 'source-uuid')
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.merge_volunteers(
  p_keep_id UUID,    -- the authenticated volunteer to keep
  p_remove_id UUID   -- the CSV orphan to merge & delete
)
RETURNS JSONB AS $$
DECLARE
  v_keep_auth UUID;
  v_remove_auth UUID;
  v_moved_participations INT := 0;
  v_moved_roles INT := 0;
  v_skipped_participations INT := 0;
BEGIN
  -- Validate: target must exist
  SELECT auth_user_id INTO v_keep_auth
  FROM public.volunteers WHERE id = p_keep_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target volunteer % not found', p_keep_id;
  END IF;

  -- Validate: source must exist
  SELECT auth_user_id INTO v_remove_auth
  FROM public.volunteers WHERE id = p_remove_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source volunteer % not found', p_remove_id;
  END IF;

  -- Safety: don't merge a volunteer into itself
  IF p_keep_id = p_remove_id THEN
    RAISE EXCEPTION 'Cannot merge a volunteer into itself';
  END IF;

  -- Transfer participation records (skip if duplicate event)
  WITH moved AS (
    UPDATE public.event_participation
    SET volunteer_id = p_keep_id,
        updated_at = NOW()
    WHERE volunteer_id = p_remove_id
      AND event_id NOT IN (
        SELECT event_id FROM public.event_participation
        WHERE volunteer_id = p_keep_id
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_moved_participations FROM moved;

  -- Delete remaining duplicate participations from source
  WITH deleted AS (
    DELETE FROM public.event_participation
    WHERE volunteer_id = p_remove_id
    RETURNING id
  )
  SELECT COUNT(*) INTO v_skipped_participations FROM deleted;

  -- Transfer roles (skip duplicates)
  WITH moved AS (
    UPDATE public.user_roles
    SET volunteer_id = p_keep_id,
        updated_at = NOW()
    WHERE volunteer_id = p_remove_id
      AND role_definition_id NOT IN (
        SELECT role_definition_id FROM public.user_roles
        WHERE volunteer_id = p_keep_id
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_moved_roles FROM moved;

  -- Delete remaining duplicate roles from source
  DELETE FROM public.user_roles WHERE volunteer_id = p_remove_id;

  -- Update any events created by the source volunteer
  UPDATE public.events
  SET created_by_volunteer_id = p_keep_id,
      updated_at = NOW()
  WHERE created_by_volunteer_id = p_remove_id;

  -- Update any participation recorded_by references
  UPDATE public.event_participation
  SET recorded_by_volunteer_id = p_keep_id
  WHERE recorded_by_volunteer_id = p_remove_id;

  -- Update any approval references
  UPDATE public.event_participation
  SET approved_by = p_keep_id
  WHERE approved_by = p_remove_id;

  -- Delete the orphan volunteer
  DELETE FROM public.volunteers WHERE id = p_remove_id;

  RETURN jsonb_build_object(
    'success', true,
    'kept', p_keep_id,
    'removed', p_remove_id,
    'participations_transferred', v_moved_participations,
    'participations_skipped', v_skipped_participations,
    'roles_transferred', v_moved_roles
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
