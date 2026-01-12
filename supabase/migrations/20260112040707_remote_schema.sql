


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'NSS Dashboard Database Schema v5 - Robust & Maintainable';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."can_register_for_event"("p_event_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    event_max_participants INT;
    current_participants INT;
    event_registration_deadline TIMESTAMPTZ;
    event_status_value TEXT;
BEGIN
    -- Get event details
    SELECT max_participants, registration_deadline, event_status
    INTO event_max_participants, event_registration_deadline, event_status_value
    FROM public.events
    WHERE id = p_event_id AND is_active = TRUE;
    
    -- Check if event exists
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check event status
    IF event_status_value NOT IN ('planned', 'registration_open') THEN
        RETURN FALSE;
    END IF;
    
    -- Check registration deadline
    IF event_registration_deadline IS NOT NULL AND event_registration_deadline < now() THEN
        RETURN FALSE;
    END IF;
    
    -- Check capacity if max_participants is set
    IF event_max_participants IS NOT NULL THEN
        SELECT COUNT(*)
        INTO current_participants
        FROM public.event_participation
        WHERE event_id = p_event_id 
        AND participation_status IN ('registered', 'present', 'partially_present');
        
        IF current_participants >= event_max_participants THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."can_register_for_event"("p_event_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_register_for_event"("p_event_id" "uuid") IS 'Event capacity and registration validation';



CREATE OR REPLACE FUNCTION "public"."create_event"("p_event_name" "text", "p_event_description" "text", "p_event_date" timestamp without time zone, "p_declared_hours" integer, "p_category_id" "uuid", "p_event_location" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  volunteer_id uuid;
  event_id uuid;
BEGIN
  -- Get the current user's volunteer ID
  SELECT id INTO volunteer_id
  FROM volunteers
  WHERE auth_user_id = auth.uid() AND is_active = true;

  IF volunteer_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not active';
  END IF;

  -- Create the event
  INSERT INTO events (
    event_name,
    event_description,
    event_date,
    declared_hours,
    category_id,
    created_by_volunteer_id,
    event_location,
    is_active
  )
  VALUES (
    p_event_name,
    p_event_description,
    p_event_date,
    p_declared_hours,
    p_category_id,
    volunteer_id,
    p_event_location,
    true
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;


ALTER FUNCTION "public"."create_event"("p_event_name" "text", "p_event_description" "text", "p_event_date" timestamp without time zone, "p_declared_hours" integer, "p_category_id" "uuid", "p_event_location" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_attendance_summary"() RETURNS TABLE("event_id" "uuid", "event_name" "text", "event_date" timestamp with time zone, "category_name" "text", "total_registered" bigint, "total_present" bigint, "total_absent" bigint, "attendance_rate" numeric, "total_hours" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    e.name as event_name,
    e.event_date,
    ec.name as category_name,
    COUNT(ep.id) as total_registered,
    COUNT(CASE WHEN ep.participation_status IN ('present', 'partially_present') THEN 1 END) as total_present,
    COUNT(CASE WHEN ep.participation_status = 'absent' THEN 1 END) as total_absent,
    CASE
      WHEN COUNT(ep.id) > 0 THEN
        ROUND((COUNT(CASE WHEN ep.participation_status IN ('present', 'partially_present') THEN 1 END)::numeric / COUNT(ep.id)::numeric) * 100, 2)
      ELSE 0
    END as attendance_rate,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours
  FROM events e
  LEFT JOIN event_categories ec ON e.category_id = ec.id
  LEFT JOIN event_participation ep ON e.id = ep.event_id
  WHERE e.is_active = true
  GROUP BY e.id, e.name, e.event_date, ec.name
  ORDER BY e.event_date DESC;
END;
$$;


ALTER FUNCTION "public"."get_attendance_summary"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_attendance_summary"() IS 'Returns events with attendance statistics and rates';



CREATE OR REPLACE FUNCTION "public"."get_category_distribution"() RETURNS TABLE("category_id" integer, "category_name" "text", "event_count" bigint, "color_hex" "text", "participant_count" bigint, "total_hours" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id as category_id,
    ec.name as category_name,
    COUNT(DISTINCT e.id) as event_count,
    COALESCE(ec.color_hex, '#6366F1') as color_hex,
    COUNT(DISTINCT ep.volunteer_id) as participant_count,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours
  FROM event_categories ec
  LEFT JOIN events e ON e.category_id = ec.id AND e.is_active = true
  LEFT JOIN event_participation ep ON e.id = ep.event_id
  WHERE ec.is_active = true
  GROUP BY ec.id, ec.name, ec.color_hex
  ORDER BY event_count DESC;
END;
$$;


ALTER FUNCTION "public"."get_category_distribution"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_category_distribution"() IS 'Returns event distribution by category with counts, participants, and total hours';



CREATE OR REPLACE FUNCTION "public"."get_current_volunteer"() RETURNS TABLE("volunteer_id" "uuid", "first_name" "text", "last_name" "text", "roll_number" "text", "email" "text", "branch" "text", "year" "text", "phone_no" "text", "birth_date" "date", "gender" "text", "nss_join_year" integer, "address" "text", "profile_pic" "text", "is_active" boolean, "roles" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as volunteer_id,
    v.first_name::text,
    v.last_name::text,
    v.roll_number::text,
    v.email::text,  -- email is CITEXT, will auto-convert to TEXT
    v.branch::text,
    v.year::text,
    COALESCE(v.phone_no::text, ''),
    v.birth_date,
    COALESCE(v.gender::text, ''),
    COALESCE(v.nss_join_year, 0),
    COALESCE(v.address::text, ''),
    COALESCE(v.profile_pic::text, ''),
    COALESCE(v.is_active, true),
    COALESCE(
      (
        SELECT array_agg(rd.role_name::text)
        FROM user_roles ur
        JOIN role_definitions rd ON ur.role_definition_id = rd.id
        WHERE ur.volunteer_id = v.id
          AND ur.is_active = true
          AND rd.is_active = true
      ),
      ARRAY['volunteer'::text]
    ) as roles
  FROM volunteers v
  WHERE v.auth_user_id = auth.uid()
    AND v.is_active = true;
END;
$$;


ALTER FUNCTION "public"."get_current_volunteer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"() RETURNS TABLE("total_events" bigint, "active_volunteers" bigint, "total_hours" bigint, "ongoing_projects" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM events WHERE is_active = true) as total_events,
    (SELECT COUNT(*) FROM volunteers WHERE is_active = true) as active_volunteers,
    (SELECT COALESCE(SUM(hours_attended), 0) FROM event_participation) as total_hours,
    (SELECT COUNT(*) FROM events WHERE event_status = 'ongoing' AND is_active = true) as ongoing_projects;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats"() IS 'Returns overall statistics: total events, active volunteers, total hours, and ongoing projects';



CREATE OR REPLACE FUNCTION "public"."get_event_participants"("event_uuid" "uuid") RETURNS TABLE("participant_id" "uuid", "volunteer_id" "uuid", "volunteer_name" "text", "roll_number" "text", "branch" "text", "year" "text", "participation_status" "text", "hours_attended" integer, "attendance_date" timestamp with time zone, "registration_date" timestamp with time zone, "notes" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ep.id as participant_id,
    v.id as volunteer_id,
    (v.first_name || ' ' || v.last_name) as volunteer_name,
    v.roll_number,
    v.branch,
    v.year,
    ep.participation_status,
    ep.hours_attended,
    ep.attendance_date,
    ep.registration_date,
    ep.notes
  FROM event_participation ep
  JOIN volunteers v ON ep.volunteer_id = v.id
  WHERE ep.event_id = event_uuid
  ORDER BY ep.registration_date DESC;
END;
$$;


ALTER FUNCTION "public"."get_event_participants"("event_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_event_participants"("event_uuid" "uuid") IS 'Returns detailed participant list for a specific event';



CREATE OR REPLACE FUNCTION "public"."get_events_with_stats"() RETURNS TABLE("event_id" "uuid", "event_name" "text", "event_description" "text", "event_date" timestamp with time zone, "declared_hours" integer, "category_name" "text", "category_color" "text", "created_by_name" "text", "participant_count" bigint, "total_declared_hours" bigint, "total_approved_hours" bigint, "is_active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    COALESCE(e.event_name, e.name)::text as event_name,
    COALESCE(e.description::text, '') as event_description,
    COALESCE(e.event_date, e.start_date::timestamp with time zone) as event_date,
    e.declared_hours,
    COALESCE(ec.category_name, ec.name)::text as category_name,
    COALESCE(ec.color_hex::text, '#6366f1') as category_color,
    (v.first_name || ' ' || v.last_name)::text as created_by_name,
    COALESCE(COUNT(ep.id), 0) as participant_count,
    COALESCE(SUM(ep.declared_hours), 0) as total_declared_hours,
    COALESCE(SUM(ep.approved_hours), 0) as total_approved_hours,
    e.is_active
  FROM events e
  LEFT JOIN event_categories ec ON e.category_id = ec.id
  LEFT JOIN volunteers v ON e.created_by_volunteer_id = v.id
  LEFT JOIN event_participation ep ON e.id = ep.event_id
  WHERE e.is_active = true
  GROUP BY e.id, e.event_name, e.name, e.description, e.event_date, e.start_date, e.declared_hours,
           ec.category_name, ec.name, ec.color_hex, v.first_name, v.last_name, e.is_active
  ORDER BY COALESCE(e.event_date, e.start_date::timestamp with time zone) DESC;
END;
$$;


ALTER FUNCTION "public"."get_events_with_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monthly_activity_trends"() RETURNS TABLE("month" "text", "month_number" integer, "year_number" integer, "events_count" bigint, "volunteers_count" bigint, "hours_sum" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', e.start_date), 'Mon') as month,
    EXTRACT(MONTH FROM DATE_TRUNC('month', e.start_date))::int as month_number,
    EXTRACT(YEAR FROM DATE_TRUNC('month', e.start_date))::int as year_number,
    COUNT(DISTINCT e.id) as events_count,
    COUNT(DISTINCT ep.volunteer_id) as volunteers_count,
    COALESCE(SUM(ep.hours_attended), 0) as hours_sum
  FROM events e
  LEFT JOIN event_participation ep ON e.id = ep.event_id
  WHERE e.is_active = true
    AND e.start_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', e.start_date)
  ORDER BY DATE_TRUNC('month', e.start_date);
END;
$$;


ALTER FUNCTION "public"."get_monthly_activity_trends"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_monthly_activity_trends"() IS 'Returns 12-month activity trends with events, volunteers, and hours aggregated by month';



CREATE OR REPLACE FUNCTION "public"."get_top_events_by_impact"("limit_count" integer DEFAULT 5) RETURNS TABLE("event_id" "uuid", "event_name" "text", "event_date" timestamp with time zone, "category_name" "text", "participant_count" bigint, "total_hours" bigint, "impact_score" "text", "event_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    e.name as event_name,
    e.event_date,
    ec.name as category_name,
    COUNT(DISTINCT ep.volunteer_id) as participant_count,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours,
    CASE
      WHEN COALESCE(SUM(ep.hours_attended), 0) > 1000 THEN 'Very High'
      WHEN COALESCE(SUM(ep.hours_attended), 0) > 500 THEN 'High'
      WHEN COALESCE(SUM(ep.hours_attended), 0) > 200 THEN 'Medium'
      ELSE 'Low'
    END as impact_score,
    e.event_status
  FROM events e
  LEFT JOIN event_categories ec ON e.category_id = ec.id
  LEFT JOIN event_participation ep ON e.id = ep.event_id
  WHERE e.is_active = true
  GROUP BY e.id, e.name, e.event_date, ec.name, e.event_status
  ORDER BY total_hours DESC, participant_count DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_top_events_by_impact"("limit_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_top_events_by_impact"("limit_count" integer) IS 'Returns top N events ranked by total hours and participation';



CREATE OR REPLACE FUNCTION "public"."get_user_stats"() RETURNS TABLE("total_users" integer, "active_users" integer, "pending_users" integer, "admin_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_users,
    COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_users,
    0::INTEGER as pending_users, -- Can be updated based on your pending logic
    COUNT(*) FILTER (WHERE role_name = 'admin')::INTEGER as admin_count
  FROM users
  WHERE is_active = true; -- Only count active users in total
END;
$$;


ALTER FUNCTION "public"."get_user_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_volunteer_hours_summary"() RETURNS TABLE("volunteer_id" "uuid", "volunteer_name" "text", "total_hours" integer, "approved_hours" integer, "events_count" integer, "last_activity" timestamp without time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as volunteer_id,
    (v.first_name || ' ' || v.last_name) as volunteer_name,
    COALESCE(SUM(ep.declared_hours), 0)::integer as total_hours,
    COALESCE(SUM(ep.approved_hours), 0)::integer as approved_hours,
    COUNT(DISTINCT ep.event_id)::integer as events_count,
    MAX(ep.updated_at) as last_activity
  FROM volunteers v
  LEFT JOIN event_participation ep ON v.id = ep.volunteer_id
  LEFT JOIN events e ON ep.event_id = e.id AND e.is_active = true
  WHERE v.is_active = true
  GROUP BY v.id, v.first_name, v.last_name
  HAVING COUNT(ep.id) > 0
  ORDER BY total_hours DESC;
END;
$$;


ALTER FUNCTION "public"."get_volunteer_hours_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_volunteer_participation_history"("volunteer_uuid" "uuid") RETURNS TABLE("event_id" "uuid", "event_name" "text", "event_date" timestamp with time zone, "category_name" "text", "participation_status" "text", "hours_attended" integer, "attendance_date" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    e.name as event_name,
    e.event_date,
    ec.name as category_name,
    ep.participation_status,
    ep.hours_attended,
    ep.attendance_date
  FROM event_participation ep
  JOIN events e ON ep.event_id = e.id
  JOIN event_categories ec ON e.category_id = ec.id
  WHERE ep.volunteer_id = volunteer_uuid
    AND e.is_active = true
  ORDER BY e.event_date DESC;
END;
$$;


ALTER FUNCTION "public"."get_volunteer_participation_history"("volunteer_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_volunteer_participation_history"("volunteer_uuid" "uuid") IS 'Returns participation history for a specific volunteer';



CREATE OR REPLACE FUNCTION "public"."get_volunteers_with_stats"() RETURNS TABLE("volunteer_id" "uuid", "first_name" "text", "last_name" "text", "roll_number" "text", "email" "text", "branch" "text", "year" "text", "phone_no" "text", "birth_date" "date", "gender" "text", "nss_join_year" integer, "address" "text", "profile_pic" "text", "is_active" boolean, "created_at" timestamp with time zone, "events_participated" bigint, "total_hours" bigint, "roles" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as volunteer_id,
    v.first_name::text,
    v.last_name::text,
    v.roll_number::text,
    v.email::text,
    v.branch::text,
    v.year::text,
    v.phone_no::text,
    v.birth_date,
    v.gender::text,
    v.nss_join_year,
    v.address::text,
    v.profile_pic::text,
    v.is_active,
    v.created_at,
    COUNT(DISTINCT ep.event_id) as events_participated,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours,
    COALESCE(
      (
        SELECT array_agg(rd.role_name::text)
        FROM user_roles ur
        JOIN role_definitions rd ON ur.role_definition_id = rd.id
        WHERE ur.volunteer_id = v.id AND ur.is_active = true
      ),
      ARRAY['volunteer'::text]
    ) as roles
  FROM volunteers v
  LEFT JOIN event_participation ep ON v.id = ep.volunteer_id
  WHERE v.is_active = true
  GROUP BY v.id
  ORDER BY v.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_volunteers_with_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_volunteers_with_stats"() IS 'Returns all volunteers with computed participation stats and roles';



CREATE OR REPLACE FUNCTION "public"."has_any_role"(VARIADIC "p_role_names" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    current_user_id UUID;
    user_has_role BOOLEAN := FALSE;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_definitions rd ON ur.role_definition_id = rd.id
        JOIN public.volunteers v ON ur.volunteer_id = v.id
        WHERE v.auth_user_id = current_user_id 
        AND rd.role_name = ANY(p_role_names)
        AND ur.is_active = TRUE
        AND rd.is_active = TRUE
        AND v.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
    ) INTO user_has_role;
    
    RETURN user_has_role;
END;
$$;


ALTER FUNCTION "public"."has_any_role"(VARIADIC "p_role_names" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_any_role"(VARIADIC "p_role_names" "text"[]) IS 'Scalable multi-role checking function';



CREATE OR REPLACE FUNCTION "public"."has_role"("p_role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    current_user_id UUID;
    user_has_role BOOLEAN := FALSE;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_definitions rd ON ur.role_definition_id = rd.id
        JOIN public.volunteers v ON ur.volunteer_id = v.id
        WHERE v.auth_user_id = current_user_id 
        AND rd.role_name = p_role_name
        AND ur.is_active = TRUE
        AND rd.is_active = TRUE
        AND v.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
    ) INTO user_has_role;
    
    RETURN user_has_role;
END;
$$;


ALTER FUNCTION "public"."has_role"("p_role_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_role"("p_role_name" "text") IS 'Robust role checking using centralized role definitions';



CREATE OR REPLACE FUNCTION "public"."mark_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_declared_hours" numeric DEFAULT 0, "p_recorded_by" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("success" boolean, "participants_added" integer, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_volunteer_id UUID;
  v_count INTEGER := 0;
  v_event_hours NUMERIC;
BEGIN
  -- Get declared hours from event if not provided
  IF p_declared_hours = 0 THEN
    SELECT declared_hours INTO v_event_hours
    FROM events
    WHERE id = p_event_id;

    p_declared_hours := COALESCE(v_event_hours, 0);
  END IF;

  -- Loop through volunteer IDs and add/update their participation
  FOREACH v_volunteer_id IN ARRAY p_volunteer_ids
  LOOP
    -- Insert or update event participation
    INSERT INTO event_participation (
      event_id,
      volunteer_id,
      participation_status,
      hours_attended,
      declared_hours,
      recorded_by_volunteer_id,
      attendance_date,
      registration_date
    )
    VALUES (
      p_event_id,
      v_volunteer_id,
      'present',  -- Mark as present
      p_declared_hours,
      p_declared_hours,
      p_recorded_by,
      NOW(),
      NOW()
    )
    ON CONFLICT (event_id, volunteer_id)
    DO UPDATE SET
      participation_status = 'present',
      hours_attended = p_declared_hours,
      declared_hours = p_declared_hours,
      attendance_date = NOW(),
      recorded_by_volunteer_id = COALESCE(p_recorded_by, event_participation.recorded_by_volunteer_id);

    v_count := v_count + 1;
  END LOOP;

  RETURN QUERY SELECT
    TRUE as success,
    v_count as participants_added,
    format('%s volunteers marked as present', v_count) as message;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT
      FALSE as success,
      0 as participants_added,
      format('Error: %s', SQLERRM) as message;
END;
$$;


ALTER FUNCTION "public"."mark_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_declared_hours" numeric, "p_recorded_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."realtime_broadcast_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  channel_name text;
  payload jsonb;
BEGIN
  -- Channel name format: table-change
  channel_name := TG_TABLE_NAME || '-change';

  -- Build payload based on operation type
  IF (TG_OP = 'DELETE') THEN
    payload = jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'old_record', row_to_json(OLD)
    );
  ELSIF (TG_OP = 'INSERT') THEN
    payload = jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'record', row_to_json(NEW)
    );
  ELSE -- UPDATE
    payload = jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
  END IF;

  -- Broadcast via Supabase Realtime (much faster than postgres_changes)
  -- This bypasses RLS and single-threaded processing
  PERFORM pg_notify(channel_name, payload::text);

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."realtime_broadcast_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_for_event"("p_event_id" "uuid", "p_declared_hours" integer DEFAULT 0) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  volunteer_id uuid;
BEGIN
  -- Get the current user's volunteer ID
  SELECT id INTO volunteer_id
  FROM volunteers
  WHERE auth_user_id = auth.uid() AND is_active = true;

  IF volunteer_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not active';
  END IF;

  -- Check if already registered
  IF EXISTS (
    SELECT 1 FROM event_participation
    WHERE event_id = p_event_id AND volunteer_id = volunteer_id
  ) THEN
    RAISE EXCEPTION 'Already registered for this event';
  END IF;

  -- Register for event
  INSERT INTO event_participation (
    event_id,
    volunteer_id,
    declared_hours
  )
  VALUES (
    p_event_id,
    volunteer_id,
    p_declared_hours
  );

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."register_for_event"("p_event_id" "uuid", "p_declared_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_attendance"("p_event_id" "uuid", "p_selected_volunteer_ids" "uuid"[]) RETURNS TABLE("removed_count" integer, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_removed INTEGER;
BEGIN
  -- Remove participants who are not in the selected list
  DELETE FROM event_participation
  WHERE event_id = p_event_id
    AND volunteer_id NOT IN (SELECT UNNEST(p_selected_volunteer_ids))
    AND participation_status = 'present';

  GET DIAGNOSTICS v_removed = ROW_COUNT;

  RETURN QUERY SELECT
    v_removed as removed_count,
    format('%s participants removed', v_removed) as message;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT
      0 as removed_count,
      format('Error: %s', SQLERRM) as message;
END;
$$;


ALTER FUNCTION "public"."sync_event_attendance"("p_event_id" "uuid", "p_selected_volunteer_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_categories_names"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- When name changes, update category_name
  IF TG_OP = 'UPDATE' AND OLD.name != NEW.name THEN
    NEW.category_name := NEW.name;
  END IF;

  -- When category_name changes, update name
  IF TG_OP = 'UPDATE' AND OLD.category_name != NEW.category_name THEN
    NEW.name := NEW.category_name;
  END IF;

  -- On insert, make sure both are set
  IF TG_OP = 'INSERT' THEN
    IF NEW.category_name IS NULL THEN
      NEW.category_name := NEW.name;
    END IF;
    IF NEW.name IS NULL THEN
      NEW.name := NEW.category_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_event_categories_names"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_events_names"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- When name changes, update event_name
  IF TG_OP = 'UPDATE' AND OLD.name != NEW.name THEN
    NEW.event_name := NEW.name;
  END IF;

  -- When event_name changes, update name
  IF TG_OP = 'UPDATE' AND OLD.event_name != NEW.event_name THEN
    NEW.name := NEW.event_name;
  END IF;

  -- On insert, make sure both are set
  IF TG_OP = 'INSERT' THEN
    IF NEW.event_name IS NULL THEN
      NEW.event_name := NEW.name;
    END IF;
    IF NEW.name IS NULL THEN
      NEW.name := NEW.event_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_events_names"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_recorded_by" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("success" boolean, "added" integer, "removed" integer, "total_present" integer, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_added INTEGER;
  v_removed INTEGER;
  v_total INTEGER;
  v_declared_hours NUMERIC;
BEGIN
  -- Get event hours
  SELECT declared_hours INTO v_declared_hours
  FROM events
  WHERE id = p_event_id;

  -- Remove participants not in the list
  SELECT removed_count INTO v_removed
  FROM sync_event_attendance(p_event_id, p_volunteer_ids);

  -- Add/update selected participants
  SELECT participants_added INTO v_added
  FROM mark_event_attendance(p_event_id, p_volunteer_ids, v_declared_hours, p_recorded_by);

  -- Get total present count
  SELECT COUNT(*)::INTEGER INTO v_total
  FROM event_participation
  WHERE event_id = p_event_id
    AND participation_status = 'present';

  RETURN QUERY SELECT
    TRUE as success,
    v_added as added,
    v_removed as removed,
    v_total as total_present,
    format('Attendance updated: %s present', v_total) as message;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT
      FALSE as success,
      0 as added,
      0 as removed,
      0 as total_present,
      format('Error updating attendance: %s', SQLERRM) as message;
END;
$$;


ALTER FUNCTION "public"."update_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_recorded_by" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."event_categories" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "color_hex" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category_name" "text" NOT NULL,
    CONSTRAINT "event_categories_code_check" CHECK (("length"(TRIM(BOTH FROM "code")) > 0)),
    CONSTRAINT "event_categories_color_hex_check" CHECK ((("color_hex" IS NULL) OR ("color_hex" ~* '^#[0-9A-F]{6}$'::"text"))),
    CONSTRAINT "event_categories_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."event_categories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."event_categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."event_categories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."event_categories_id_seq" OWNED BY "public"."event_categories"."id";



CREATE TABLE IF NOT EXISTS "public"."event_participation" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "volunteer_id" "uuid" NOT NULL,
    "hours_attended" integer NOT NULL,
    "participation_status" "text" DEFAULT 'registered'::"text" NOT NULL,
    "registration_date" timestamp with time zone DEFAULT "now"(),
    "attendance_date" timestamp with time zone,
    "notes" "text",
    "feedback" "text",
    "recorded_by_volunteer_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "declared_hours" integer DEFAULT 0,
    "approved_hours" integer,
    CONSTRAINT "event_participation_hours_attended_check" CHECK (("hours_attended" >= 0)),
    CONSTRAINT "event_participation_participation_status_check" CHECK (("participation_status" = ANY (ARRAY['registered'::"text", 'present'::"text", 'absent'::"text", 'partially_present'::"text", 'excused'::"text"])))
);


ALTER TABLE "public"."event_participation" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_participation" IS 'Comprehensive participation tracking with registration workflow';



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "declared_hours" integer NOT NULL,
    "category_id" integer NOT NULL,
    "min_participants" integer,
    "max_participants" integer,
    "event_status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "location" "text",
    "registration_deadline" timestamp with time zone,
    "created_by_volunteer_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_date" timestamp with time zone,
    "event_name" "text" NOT NULL,
    CONSTRAINT "events_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "events_check1" CHECK ((("min_participants" IS NULL) OR ("max_participants" IS NULL) OR ("min_participants" <= "max_participants"))),
    CONSTRAINT "events_declared_hours_check" CHECK ((("declared_hours" >= 1) AND ("declared_hours" <= 240))),
    CONSTRAINT "events_event_status_check" CHECK (("event_status" = ANY (ARRAY['planned'::"text", 'registration_open'::"text", 'registration_closed'::"text", 'ongoing'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "events_max_participants_check" CHECK ((("max_participants" IS NULL) OR ("max_participants" > 0))),
    CONSTRAINT "events_min_participants_check" CHECK ((("min_participants" IS NULL) OR ("min_participants" > 0))),
    CONSTRAINT "events_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON TABLE "public"."events" IS 'Enhanced events with multi-day support, capacity management, and status workflow';



CREATE TABLE IF NOT EXISTS "public"."volunteers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_user_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "roll_number" "text" NOT NULL,
    "email" "public"."citext" NOT NULL,
    "branch" "text" NOT NULL,
    "year" "text" NOT NULL,
    "phone_no" "text",
    "birth_date" "date",
    "gender" "text",
    "nss_join_year" integer,
    "address" "text",
    "profile_pic" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "volunteers_birth_date_check" CHECK ((("birth_date" IS NULL) OR ("birth_date" <= CURRENT_DATE))),
    CONSTRAINT "volunteers_branch_check" CHECK (("branch" = ANY (ARRAY['EXCS'::"text", 'CMPN'::"text", 'IT'::"text", 'BIO-MED'::"text", 'EXTC'::"text"]))),
    CONSTRAINT "volunteers_email_check" CHECK (("email" OPERATOR("public".~*) '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"public"."citext")),
    CONSTRAINT "volunteers_first_name_check" CHECK (("length"(TRIM(BOTH FROM "first_name")) > 0)),
    CONSTRAINT "volunteers_gender_check" CHECK (("gender" = ANY (ARRAY['M'::"text", 'F'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "volunteers_last_name_check" CHECK (("length"(TRIM(BOTH FROM "last_name")) > 0)),
    CONSTRAINT "volunteers_nss_join_year_check" CHECK ((("nss_join_year" >= 2020) AND (("nss_join_year")::numeric <= (EXTRACT(year FROM CURRENT_DATE) + (1)::numeric)))),
    CONSTRAINT "volunteers_phone_no_check" CHECK ((("phone_no" IS NULL) OR ("length"(TRIM(BOTH FROM "phone_no")) >= 10))),
    CONSTRAINT "volunteers_roll_number_check" CHECK (("length"(TRIM(BOTH FROM "roll_number")) > 0)),
    CONSTRAINT "volunteers_year_check" CHECK (("year" = ANY (ARRAY['FE'::"text", 'SE'::"text", 'TE'::"text"])))
);


ALTER TABLE "public"."volunteers" OWNER TO "postgres";


COMMENT ON TABLE "public"."volunteers" IS 'Universal volunteer table - everyone is a volunteer first';



CREATE OR REPLACE VIEW "public"."event_summary" AS
 SELECT "e"."id",
    "e"."name",
    "e"."description",
    "e"."start_date",
    "e"."end_date",
    (("e"."end_date" - "e"."start_date") + 1) AS "duration_days",
    "e"."declared_hours",
    "ec"."name" AS "category",
    "ec"."color_hex" AS "category_color",
    "e"."min_participants",
    "e"."max_participants",
    "e"."event_status",
    "e"."location",
    "e"."registration_deadline",
    "count"(DISTINCT "ep"."id") AS "total_participants",
    "count"(DISTINCT
        CASE
            WHEN ("ep"."participation_status" = 'registered'::"text") THEN "ep"."id"
            ELSE NULL::"uuid"
        END) AS "registered_count",
    "count"(DISTINCT
        CASE
            WHEN ("ep"."participation_status" = 'present'::"text") THEN "ep"."id"
            ELSE NULL::"uuid"
        END) AS "present_count",
    "count"(DISTINCT
        CASE
            WHEN ("ep"."participation_status" = 'absent'::"text") THEN "ep"."id"
            ELSE NULL::"uuid"
        END) AS "absent_count",
    "count"(DISTINCT
        CASE
            WHEN ("ep"."participation_status" = 'partially_present'::"text") THEN "ep"."id"
            ELSE NULL::"uuid"
        END) AS "partial_count",
        CASE
            WHEN ("e"."max_participants" IS NOT NULL) THEN "round"(((("count"(DISTINCT
            CASE
                WHEN ("ep"."participation_status" = ANY (ARRAY['registered'::"text", 'present'::"text", 'partially_present'::"text"])) THEN "ep"."id"
                ELSE NULL::"uuid"
            END))::numeric * 100.0) / ("e"."max_participants")::numeric), 2)
            ELSE NULL::numeric
        END AS "capacity_percentage",
        CASE
            WHEN ("e"."max_participants" IS NOT NULL) THEN ("e"."max_participants" - "count"(DISTINCT
            CASE
                WHEN ("ep"."participation_status" = ANY (ARRAY['registered'::"text", 'present'::"text", 'partially_present'::"text"])) THEN "ep"."id"
                ELSE NULL::"uuid"
            END))
            ELSE NULL::bigint
        END AS "available_slots",
    COALESCE("avg"("ep"."hours_attended"), (0)::numeric) AS "avg_hours_attended",
    COALESCE("sum"("ep"."hours_attended"), (0)::bigint) AS "total_hours_logged",
    (("cv"."first_name" || ' '::"text") || "cv"."last_name") AS "created_by",
    "e"."created_at",
    "e"."updated_at"
   FROM ((("public"."events" "e"
     LEFT JOIN "public"."event_categories" "ec" ON (("e"."category_id" = "ec"."id")))
     LEFT JOIN "public"."event_participation" "ep" ON (("e"."id" = "ep"."event_id")))
     LEFT JOIN "public"."volunteers" "cv" ON (("e"."created_by_volunteer_id" = "cv"."id")))
  WHERE ("e"."is_active" = true)
  GROUP BY "e"."id", "e"."name", "e"."description", "e"."start_date", "e"."end_date", "e"."declared_hours", "ec"."name", "ec"."color_hex", "e"."min_participants", "e"."max_participants", "e"."event_status", "e"."location", "e"."registration_deadline", "cv"."first_name", "cv"."last_name", "e"."created_at", "e"."updated_at";


ALTER VIEW "public"."event_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."event_summary" IS 'Comprehensive event analytics with capacity tracking';



CREATE TABLE IF NOT EXISTS "public"."role_definitions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "role_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "hierarchy_level" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "role_definitions_display_name_check" CHECK (("length"(TRIM(BOTH FROM "display_name")) > 0)),
    CONSTRAINT "role_definitions_role_name_check" CHECK (("length"(TRIM(BOTH FROM "role_name")) > 0))
);


ALTER TABLE "public"."role_definitions" OWNER TO "postgres";


COMMENT ON TABLE "public"."role_definitions" IS 'Centralized role definitions with permissions - SCALABLE';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "volunteer_id" "uuid" NOT NULL,
    "role_definition_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_roles" IS 'Role assignments to volunteers - clean separation of concerns';



CREATE OR REPLACE VIEW "public"."role_management" AS
 SELECT "v"."id" AS "volunteer_id",
    (("v"."first_name" || ' '::"text") || "v"."last_name") AS "volunteer_name",
    "v"."roll_number",
    "v"."email",
    "v"."branch",
    "v"."year",
    "ur"."id" AS "assignment_id",
    "rd"."role_name",
    "rd"."display_name" AS "role_display_name",
    "rd"."hierarchy_level",
    "ur"."assigned_at",
    "ur"."expires_at",
    "ur"."is_active" AS "assignment_active",
    (("av"."first_name" || ' '::"text") || "av"."last_name") AS "assigned_by_name"
   FROM ((("public"."volunteers" "v"
     LEFT JOIN "public"."user_roles" "ur" ON (("v"."id" = "ur"."volunteer_id")))
     LEFT JOIN "public"."role_definitions" "rd" ON (("ur"."role_definition_id" = "rd"."id")))
     LEFT JOIN "public"."volunteers" "av" ON (("ur"."assigned_by" = "av"."id")))
  WHERE ("v"."is_active" = true)
  ORDER BY "v"."roll_number", "rd"."hierarchy_level";


ALTER VIEW "public"."role_management" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."volunteer_summary" AS
 SELECT "v"."id",
    "v"."first_name",
    "v"."last_name",
    (("v"."first_name" || ' '::"text") || "v"."last_name") AS "full_name",
    "v"."roll_number",
    "v"."email",
    "v"."branch",
    "v"."year",
    "v"."phone_no",
    "v"."nss_join_year",
    "v"."is_active",
    COALESCE("array_agg"("rd"."role_name" ORDER BY "rd"."hierarchy_level") FILTER (WHERE ("rd"."role_name" IS NOT NULL)), ARRAY[]::"text"[]) AS "roles",
    COALESCE("array_agg"("rd"."display_name" ORDER BY "rd"."hierarchy_level") FILTER (WHERE ("rd"."display_name" IS NOT NULL)), ARRAY[]::"text"[]) AS "role_display_names",
    "min"("rd"."hierarchy_level") AS "highest_role_level",
    "count"(DISTINCT "ep"."id") AS "total_events_participated",
    COALESCE("sum"("ep"."hours_attended"), (0)::bigint) AS "total_hours_completed",
    "count"(DISTINCT
        CASE
            WHEN ("ep"."participation_status" = 'present'::"text") THEN "ep"."id"
            ELSE NULL::"uuid"
        END) AS "events_attended",
    "count"(DISTINCT
        CASE
            WHEN ("ep"."participation_status" = 'absent'::"text") THEN "ep"."id"
            ELSE NULL::"uuid"
        END) AS "events_missed",
    "count"(DISTINCT
        CASE
            WHEN ("ep"."participation_status" = 'registered'::"text") THEN "ep"."id"
            ELSE NULL::"uuid"
        END) AS "events_registered",
    "max"("e"."end_date") AS "last_event_date",
    "v"."created_at",
    "v"."updated_at"
   FROM (((("public"."volunteers" "v"
     LEFT JOIN "public"."user_roles" "ur" ON ((("v"."id" = "ur"."volunteer_id") AND ("ur"."is_active" = true) AND (("ur"."expires_at" IS NULL) OR ("ur"."expires_at" > "now"())))))
     LEFT JOIN "public"."role_definitions" "rd" ON ((("ur"."role_definition_id" = "rd"."id") AND ("rd"."is_active" = true))))
     LEFT JOIN "public"."event_participation" "ep" ON (("v"."id" = "ep"."volunteer_id")))
     LEFT JOIN "public"."events" "e" ON ((("ep"."event_id" = "e"."id") AND ("e"."is_active" = true))))
  GROUP BY "v"."id", "v"."first_name", "v"."last_name", "v"."roll_number", "v"."email", "v"."branch", "v"."year", "v"."phone_no", "v"."nss_join_year", "v"."is_active", "v"."created_at", "v"."updated_at";


ALTER VIEW "public"."volunteer_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."volunteer_summary" IS 'Complete volunteer information with enhanced role details';



ALTER TABLE ONLY "public"."event_categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."event_categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_participation"
    ADD CONSTRAINT "event_participation_event_id_volunteer_id_key" UNIQUE ("event_id", "volunteer_id");



ALTER TABLE ONLY "public"."event_participation"
    ADD CONSTRAINT "event_participation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_definitions"
    ADD CONSTRAINT "role_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_definitions"
    ADD CONSTRAINT "role_definitions_role_name_key" UNIQUE ("role_name");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_volunteer_id_role_definition_id_key" UNIQUE ("volunteer_id", "role_definition_id");



ALTER TABLE ONLY "public"."volunteers"
    ADD CONSTRAINT "volunteers_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."volunteers"
    ADD CONSTRAINT "volunteers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."volunteers"
    ADD CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."volunteers"
    ADD CONSTRAINT "volunteers_roll_number_key" UNIQUE ("roll_number");



CREATE INDEX "idx_event_participation_status" ON "public"."event_participation" USING "btree" ("event_id", "participation_status");



CREATE INDEX "idx_event_participation_volunteer" ON "public"."event_participation" USING "btree" ("volunteer_id", "participation_status");



CREATE INDEX "idx_events_active" ON "public"."events" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_events_category" ON "public"."events" USING "btree" ("category_id");



CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by_volunteer_id");



CREATE INDEX "idx_events_end_date" ON "public"."events" USING "btree" ("end_date" DESC);



CREATE INDEX "idx_events_start_date" ON "public"."events" USING "btree" ("start_date" DESC);



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("event_status");



CREATE INDEX "idx_participation_event" ON "public"."event_participation" USING "btree" ("event_id");



CREATE INDEX "idx_participation_registration" ON "public"."event_participation" USING "btree" ("registration_date");



CREATE INDEX "idx_participation_status" ON "public"."event_participation" USING "btree" ("participation_status");



CREATE INDEX "idx_participation_volunteer" ON "public"."event_participation" USING "btree" ("volunteer_id");



CREATE INDEX "idx_role_definitions_active" ON "public"."role_definitions" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_role_definitions_hierarchy" ON "public"."role_definitions" USING "btree" ("hierarchy_level");



CREATE INDEX "idx_role_definitions_name" ON "public"."role_definitions" USING "btree" ("role_name");



CREATE INDEX "idx_user_roles_active" ON "public"."user_roles" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_user_roles_expires" ON "public"."user_roles" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE INDEX "idx_user_roles_role_def" ON "public"."user_roles" USING "btree" ("role_definition_id");



CREATE INDEX "idx_user_roles_volunteer" ON "public"."user_roles" USING "btree" ("volunteer_id");



CREATE INDEX "idx_volunteers_active" ON "public"."volunteers" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_volunteers_auth_user" ON "public"."volunteers" USING "btree" ("auth_user_id");



CREATE INDEX "idx_volunteers_branch" ON "public"."volunteers" USING "btree" ("branch");



CREATE INDEX "idx_volunteers_email" ON "public"."volunteers" USING "btree" ("email");



CREATE INDEX "idx_volunteers_roll_number" ON "public"."volunteers" USING "btree" ("roll_number");



CREATE INDEX "idx_volunteers_year" ON "public"."volunteers" USING "btree" ("year");



CREATE OR REPLACE TRIGGER "event_categories_realtime_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."event_categories" FOR EACH ROW EXECUTE FUNCTION "public"."realtime_broadcast_changes"();



CREATE OR REPLACE TRIGGER "event_participation_realtime_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."event_participation" FOR EACH ROW EXECUTE FUNCTION "public"."realtime_broadcast_changes"();



CREATE OR REPLACE TRIGGER "events_realtime_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."realtime_broadcast_changes"();



CREATE OR REPLACE TRIGGER "set_event_categories_updated_at" BEFORE UPDATE ON "public"."event_categories" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_participation_updated_at" BEFORE UPDATE ON "public"."event_participation" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_role_definitions_updated_at" BEFORE UPDATE ON "public"."role_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_volunteers_updated_at" BEFORE UPDATE ON "public"."volunteers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "sync_event_categories_names_trigger" BEFORE INSERT OR UPDATE ON "public"."event_categories" FOR EACH ROW EXECUTE FUNCTION "public"."sync_event_categories_names"();



CREATE OR REPLACE TRIGGER "sync_events_names_trigger" BEFORE INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."sync_events_names"();



CREATE OR REPLACE TRIGGER "user_roles_realtime_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."realtime_broadcast_changes"();



CREATE OR REPLACE TRIGGER "volunteers_realtime_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."volunteers" FOR EACH ROW EXECUTE FUNCTION "public"."realtime_broadcast_changes"();



ALTER TABLE ONLY "public"."event_participation"
    ADD CONSTRAINT "event_participation_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_participation"
    ADD CONSTRAINT "event_participation_recorded_by_volunteer_id_fkey" FOREIGN KEY ("recorded_by_volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."event_participation"
    ADD CONSTRAINT "event_participation_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_volunteer_id_fkey" FOREIGN KEY ("created_by_volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."volunteers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_definition_id_fkey" FOREIGN KEY ("role_definition_id") REFERENCES "public"."role_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."volunteers"
    ADD CONSTRAINT "volunteers_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."event_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_categories_public_read" ON "public"."event_categories" FOR SELECT USING (true);



ALTER TABLE "public"."event_participation" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_participation_own_records" ON "public"."event_participation" USING (("volunteer_id" IN ( SELECT "volunteers"."id"
   FROM "public"."volunteers"
  WHERE ("volunteers"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events_create_authenticated" ON "public"."events" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "events_public_read" ON "public"."events" FOR SELECT USING (("is_active" = true));



CREATE POLICY "events_update_own" ON "public"."events" FOR UPDATE USING (("created_by_volunteer_id" IN ( SELECT "volunteers"."id"
   FROM "public"."volunteers"
  WHERE ("volunteers"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."role_definitions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "role_definitions_read_all" ON "public"."role_definitions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_roles_insert_system" ON "public"."user_roles" FOR INSERT WITH CHECK (true);



CREATE POLICY "user_roles_own_only" ON "public"."user_roles" FOR SELECT USING (("volunteer_id" IN ( SELECT "volunteers"."id"
   FROM "public"."volunteers"
  WHERE ("volunteers"."auth_user_id" = "auth"."uid"()))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."event_categories";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."event_participation";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."events";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_roles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."volunteers";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."can_register_for_event"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_register_for_event"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_register_for_event"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event"("p_event_name" "text", "p_event_description" "text", "p_event_date" timestamp without time zone, "p_declared_hours" integer, "p_category_id" "uuid", "p_event_location" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_event"("p_event_name" "text", "p_event_description" "text", "p_event_date" timestamp without time zone, "p_declared_hours" integer, "p_category_id" "uuid", "p_event_location" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event"("p_event_name" "text", "p_event_description" "text", "p_event_date" timestamp without time zone, "p_declared_hours" integer, "p_category_id" "uuid", "p_event_location" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_attendance_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_attendance_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_attendance_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_category_distribution"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_distribution"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_distribution"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_volunteer"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_volunteer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_volunteer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_participants"("event_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_participants"("event_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_participants"("event_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_events_with_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_events_with_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_events_with_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monthly_activity_trends"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_monthly_activity_trends"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monthly_activity_trends"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_events_by_impact"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_events_by_impact"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_events_by_impact"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_volunteer_hours_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_volunteer_hours_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_volunteer_hours_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_volunteer_participation_history"("volunteer_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_volunteer_participation_history"("volunteer_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_volunteer_participation_history"("volunteer_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_volunteers_with_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_volunteers_with_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_volunteers_with_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_any_role"(VARIADIC "p_role_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_any_role"(VARIADIC "p_role_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_any_role"(VARIADIC "p_role_names" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("p_role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("p_role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("p_role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_declared_hours" numeric, "p_recorded_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_declared_hours" numeric, "p_recorded_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_declared_hours" numeric, "p_recorded_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."realtime_broadcast_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."realtime_broadcast_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."realtime_broadcast_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_for_event"("p_event_id" "uuid", "p_declared_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."register_for_event"("p_event_id" "uuid", "p_declared_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_for_event"("p_event_id" "uuid", "p_declared_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_attendance"("p_event_id" "uuid", "p_selected_volunteer_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_attendance"("p_event_id" "uuid", "p_selected_volunteer_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_attendance"("p_event_id" "uuid", "p_selected_volunteer_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_categories_names"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_categories_names"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_categories_names"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_events_names"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_events_names"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_events_names"() TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_recorded_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_recorded_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_attendance"("p_event_id" "uuid", "p_volunteer_ids" "uuid"[], "p_recorded_by" "uuid") TO "service_role";












GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";









GRANT ALL ON TABLE "public"."event_categories" TO "anon";
GRANT ALL ON TABLE "public"."event_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."event_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_participation" TO "anon";
GRANT ALL ON TABLE "public"."event_participation" TO "authenticated";
GRANT ALL ON TABLE "public"."event_participation" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."volunteers" TO "anon";
GRANT ALL ON TABLE "public"."volunteers" TO "authenticated";
GRANT ALL ON TABLE "public"."volunteers" TO "service_role";



GRANT ALL ON TABLE "public"."event_summary" TO "anon";
GRANT ALL ON TABLE "public"."event_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."event_summary" TO "service_role";



GRANT ALL ON TABLE "public"."role_definitions" TO "anon";
GRANT ALL ON TABLE "public"."role_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."role_management" TO "anon";
GRANT ALL ON TABLE "public"."role_management" TO "authenticated";
GRANT ALL ON TABLE "public"."role_management" TO "service_role";



GRANT ALL ON TABLE "public"."volunteer_summary" TO "anon";
GRANT ALL ON TABLE "public"."volunteer_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."volunteer_summary" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































