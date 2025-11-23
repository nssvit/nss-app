-- NSS Dashboard - Supabase Database Functions
-- Required functions for dashboard statistics, analytics, and real-time data
-- Run this in your Supabase SQL Editor after applying psql_schema_v6.sql

-- =====================================================================
-- 1. GET DASHBOARD STATISTICS
-- Returns overall statistics for the dashboard overview
-- =====================================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_events bigint,
  active_volunteers bigint,
  total_hours bigint,
  ongoing_projects bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- =====================================================================
-- 2. GET MONTHLY ACTIVITY TRENDS
-- Returns 12-month activity trends for charts
-- =====================================================================
CREATE OR REPLACE FUNCTION get_monthly_activity_trends()
RETURNS TABLE (
  month text,
  month_number int,
  year_number int,
  events_count bigint,
  volunteers_count bigint,
  hours_sum bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_monthly_activity_trends() TO authenticated;

-- =====================================================================
-- 3. GET CATEGORY DISTRIBUTION
-- Returns event distribution by category for analytics
-- =====================================================================
CREATE OR REPLACE FUNCTION get_category_distribution()
RETURNS TABLE (
  category_id int,
  category_name text,
  event_count bigint,
  color_hex text,
  participant_count bigint,
  total_hours bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_category_distribution() TO authenticated;

-- =====================================================================
-- 4. GET TOP EVENTS BY IMPACT
-- Returns top events ranked by participation and hours
-- =====================================================================
CREATE OR REPLACE FUNCTION get_top_events_by_impact(limit_count int DEFAULT 5)
RETURNS TABLE (
  event_id uuid,
  event_name text,
  event_date timestamptz,
  category_name text,
  participant_count bigint,
  total_hours bigint,
  impact_score text,
  event_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_top_events_by_impact(int) TO authenticated;

-- =====================================================================
-- 5. GET VOLUNTEERS WITH STATS
-- Returns volunteers with computed participation statistics
-- Optimized single-query replacement for multiple queries
-- =====================================================================
CREATE OR REPLACE FUNCTION get_volunteers_with_stats()
RETURNS TABLE (
  volunteer_id uuid,
  first_name text,
  last_name text,
  roll_number text,
  email text,
  branch text,
  year text,
  phone_no text,
  birth_date date,
  gender text,
  nss_join_year int,
  address text,
  profile_pic text,
  is_active boolean,
  created_at timestamptz,
  events_participated bigint,
  total_hours bigint,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_volunteers_with_stats() TO authenticated;

-- =====================================================================
-- 6. GET ATTENDANCE SUMMARY
-- Returns events with attendance statistics
-- =====================================================================
CREATE OR REPLACE FUNCTION get_attendance_summary()
RETURNS TABLE (
  event_id uuid,
  event_name text,
  event_date timestamptz,
  category_name text,
  total_registered bigint,
  total_present bigint,
  total_absent bigint,
  attendance_rate numeric,
  total_hours bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_attendance_summary() TO authenticated;

-- =====================================================================
-- 7. GET EVENT PARTICIPANTS
-- Returns detailed participant list for a specific event
-- =====================================================================
CREATE OR REPLACE FUNCTION get_event_participants(event_uuid uuid)
RETURNS TABLE (
  participant_id uuid,
  volunteer_id uuid,
  volunteer_name text,
  roll_number text,
  branch text,
  year text,
  participation_status text,
  hours_attended int,
  attendance_date timestamptz,
  registration_date timestamptz,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_event_participants(uuid) TO authenticated;

-- =====================================================================
-- 8. GET VOLUNTEER PARTICIPATION HISTORY
-- Returns participation history for a specific volunteer
-- =====================================================================
CREATE OR REPLACE FUNCTION get_volunteer_participation_history(volunteer_uuid uuid)
RETURNS TABLE (
  event_id uuid,
  event_name text,
  event_date timestamptz,
  category_name text,
  participation_status text,
  hours_attended int,
  attendance_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_volunteer_participation_history(uuid) TO authenticated;

-- =====================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================
COMMENT ON FUNCTION get_dashboard_stats() IS 'Returns overall statistics: total events, active volunteers, total hours, and ongoing projects';
COMMENT ON FUNCTION get_monthly_activity_trends() IS 'Returns 12-month activity trends with events, volunteers, and hours aggregated by month';
COMMENT ON FUNCTION get_category_distribution() IS 'Returns event distribution by category with counts, participants, and total hours';
COMMENT ON FUNCTION get_top_events_by_impact(int) IS 'Returns top N events ranked by total hours and participation';
COMMENT ON FUNCTION get_volunteers_with_stats() IS 'Returns all volunteers with computed participation stats and roles';
COMMENT ON FUNCTION get_attendance_summary() IS 'Returns events with attendance statistics and rates';
COMMENT ON FUNCTION get_event_participants(uuid) IS 'Returns detailed participant list for a specific event';
COMMENT ON FUNCTION get_volunteer_participation_history(uuid) IS 'Returns participation history for a specific volunteer';
