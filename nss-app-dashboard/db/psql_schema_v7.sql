-- =====================================================================================================
-- NSS Dashboard Database Schema v7 - Complete Production Database
-- =====================================================================================================
-- This is a complete, consolidated database schema including all migrations and functions
-- Run this script in your Supabase SQL Editor to set up the complete database
--
-- Version: 7.0.0
-- Updated: 2024-11-23
-- Changes from v6:
--   - Consolidated all SQL migrations into single file
--   - Added all dashboard statistics and analytics functions
--   - Added attendance tracking via event form functions
--   - Added unique constraint on event_participation to prevent duplicates
--   - Removed realtime broadcast triggers (not needed)
-- =====================================================================================================

-- =====================================
-- EXTENSIONS
-- =====================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- TABLES (Based on actual working schema)
-- =====================================

-- 1. Event Categories Table
CREATE TABLE IF NOT EXISTS event_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM name)) > 0),
  category_name TEXT NOT NULL, -- App compatibility column
  code TEXT NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM code)) > 0),
  description TEXT,
  color_hex TEXT CHECK (color_hex IS NULL OR color_hex ~* '^#[0-9A-F]{6}$'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Role Definitions Table
CREATE TABLE IF NOT EXISTS role_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name TEXT NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM role_name)) > 0),
  display_name TEXT NOT NULL CHECK (length(TRIM(BOTH FROM display_name)) > 0),
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  hierarchy_level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  first_name TEXT NOT NULL CHECK (length(TRIM(BOTH FROM first_name)) > 0),
  last_name TEXT NOT NULL CHECK (length(TRIM(BOTH FROM last_name)) > 0),
  roll_number TEXT NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM roll_number)) > 0),
  email CITEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  branch TEXT NOT NULL CHECK (branch = ANY (ARRAY['EXCS'::text, 'CMPN'::text, 'IT'::text, 'BIO-MED'::text, 'EXTC'::text])),
  year TEXT NOT NULL CHECK (year = ANY (ARRAY['FE'::text, 'SE'::text, 'TE'::text])),
  phone_no TEXT CHECK (phone_no IS NULL OR length(TRIM(BOTH FROM phone_no)) >= 10),
  birth_date DATE CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE),
  gender TEXT CHECK (gender = ANY (ARRAY['M'::text, 'F'::text, 'Prefer not to say'::text])),
  nss_join_year INTEGER CHECK (nss_join_year >= 2020 AND nss_join_year::numeric <= (EXTRACT(year FROM CURRENT_DATE) + 1::numeric)),
  address TEXT,
  profile_pic TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT volunteers_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);

-- 4. User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID NOT NULL,
  role_definition_id UUID NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
  CONSTRAINT user_roles_role_definition_id_fkey FOREIGN KEY (role_definition_id) REFERENCES role_definitions(id),
  CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES volunteers(id)
);

-- 5. Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(TRIM(BOTH FROM name)) > 0),
  event_name TEXT NOT NULL, -- App compatibility column
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE, -- App compatibility column
  declared_hours INTEGER NOT NULL CHECK (declared_hours >= 1 AND declared_hours <= 240),
  category_id INTEGER NOT NULL,
  min_participants INTEGER CHECK (min_participants IS NULL OR min_participants > 0),
  max_participants INTEGER CHECK (max_participants IS NULL OR max_participants > 0),
  event_status TEXT NOT NULL DEFAULT 'planned'::text CHECK (event_status = ANY (ARRAY['planned'::text, 'registration_open'::text, 'registration_closed'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text])),
  location TEXT,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  created_by_volunteer_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT events_category_id_fkey FOREIGN KEY (category_id) REFERENCES event_categories(id),
  CONSTRAINT events_created_by_volunteer_id_fkey FOREIGN KEY (created_by_volunteer_id) REFERENCES volunteers(id)
);

-- 6. Event Participation Table
CREATE TABLE IF NOT EXISTS event_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL,
  volunteer_id UUID NOT NULL,
  hours_attended INTEGER NOT NULL CHECK (hours_attended >= 0),
  declared_hours INTEGER DEFAULT 0 CHECK (declared_hours >= 0), -- App compatibility column
  approved_hours INTEGER CHECK (approved_hours >= 0), -- App compatibility column
  participation_status TEXT NOT NULL DEFAULT 'registered'::text CHECK (participation_status = ANY (ARRAY['registered'::text, 'present'::text, 'absent'::text, 'partially_present'::text, 'excused'::text])),
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attendance_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  feedback TEXT,
  recorded_by_volunteer_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT event_participation_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT event_participation_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
  CONSTRAINT event_participation_recorded_by_volunteer_id_fkey FOREIGN KEY (recorded_by_volunteer_id) REFERENCES volunteers(id),
  CONSTRAINT event_participation_unique_volunteer_event UNIQUE (event_id, volunteer_id)
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================
CREATE INDEX IF NOT EXISTS volunteers_auth_user_id_idx ON volunteers(auth_user_id);
CREATE INDEX IF NOT EXISTS volunteers_email_idx ON volunteers(email);
CREATE INDEX IF NOT EXISTS user_roles_volunteer_id_idx ON user_roles(volunteer_id);
CREATE INDEX IF NOT EXISTS user_roles_role_definition_id_idx ON user_roles(role_definition_id);
CREATE INDEX IF NOT EXISTS events_category_id_idx ON events(category_id);
CREATE INDEX IF NOT EXISTS events_created_by_volunteer_id_idx ON events(created_by_volunteer_id);
CREATE INDEX IF NOT EXISTS event_participation_event_id_idx ON event_participation(event_id);
CREATE INDEX IF NOT EXISTS event_participation_volunteer_id_idx ON event_participation(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_event_participation_status ON event_participation(event_id, participation_status);
CREATE INDEX IF NOT EXISTS idx_event_participation_volunteer ON event_participation(volunteer_id, participation_status);

-- =====================================
-- TRIGGERS FOR DATA CONSISTENCY
-- =====================================

-- Keep name columns in sync for event_categories
CREATE OR REPLACE FUNCTION sync_event_categories_names()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.category_name := COALESCE(NEW.category_name, NEW.name);
    NEW.name := COALESCE(NEW.name, NEW.category_name);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.name != NEW.name THEN
      NEW.category_name := NEW.name;
    ELSIF OLD.category_name != NEW.category_name THEN
      NEW.name := NEW.category_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_event_categories_names_trigger
  BEFORE INSERT OR UPDATE ON event_categories
  FOR EACH ROW EXECUTE FUNCTION sync_event_categories_names();

-- Keep name columns in sync for events
CREATE OR REPLACE FUNCTION sync_events_names()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.event_name := COALESCE(NEW.event_name, NEW.name);
    NEW.name := COALESCE(NEW.name, NEW.event_name);
    NEW.event_date := COALESCE(NEW.event_date, NEW.start_date::timestamp with time zone);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.name != NEW.name THEN
      NEW.event_name := NEW.name;
    ELSIF OLD.event_name != NEW.event_name THEN
      NEW.name := NEW.event_name;
    END IF;

    IF OLD.start_date != NEW.start_date THEN
      NEW.event_date := NEW.start_date::timestamp with time zone;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_events_names_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION sync_events_names();

-- Keep hours columns in sync for event_participation
CREATE OR REPLACE FUNCTION sync_participation_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.declared_hours := COALESCE(NEW.declared_hours, NEW.hours_attended);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.hours_attended != NEW.hours_attended AND NEW.declared_hours = OLD.declared_hours THEN
      NEW.declared_hours := NEW.hours_attended;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_participation_hours_trigger
  BEFORE INSERT OR UPDATE ON event_participation
  FOR EACH ROW EXECUTE FUNCTION sync_participation_hours();

-- =====================================
-- INITIAL DATA
-- =====================================

-- Insert role definitions
INSERT INTO role_definitions (role_name, display_name, description, hierarchy_level, permissions)
VALUES
  ('admin', 'Administrator', 'Full system access with all permissions', 1, '{"all": true, "users": true, "events": true, "roles": true, "system": true}'),
  ('program_officer', 'Program Officer', 'Event and user management capabilities', 2, '{"events": true, "users": true, "reports": true, "participation": true}'),
  ('heads', 'Head/Lead', 'Team leadership and event coordination', 3, '{"events": true, "team": true, "participation": true, "reports": true}'),
  ('volunteer', 'Volunteer', 'Basic volunteer access and profile management', 4, '{"profile": true, "events_view": true, "participation": true}')
ON CONFLICT (role_name) DO NOTHING;

-- Insert event categories
INSERT INTO event_categories (name, category_name, code, description, color_hex)
VALUES
('Community Service', 'Community Service', 'COMMUNITY', 'Community service and social work activities', '#10b981'),
('Environmental', 'Environmental', 'ENVIRONMENT', 'Environmental conservation and sustainability programs', '#059669'),
('Educational', 'Educational', 'EDUCATION', 'Educational programs and awareness campaigns', '#3b82f6'),
('Health & Wellness', 'Health & Wellness', 'HEALTH', 'Health awareness and wellness programs', '#ef4444'),
('Cultural', 'Cultural', 'CULTURAL', 'Cultural events and traditional celebrations', '#f59e0b'),
('Sports & Recreation', 'Sports & Recreation', 'SPORTS', 'Sports events and recreational activities', '#8b5cf6'),
('Awareness Campaign', 'Awareness Campaign', 'AWARENESS', 'Social awareness drives and campaigns', '#06b6d4'),
('Blood Donation', 'Blood Donation', 'BLOOD', 'Blood donation camps and drives', '#dc2626'),
('Cleanliness Drive', 'Cleanliness Drive', 'CLEAN', 'Cleanliness and sanitation drives', '#16a34a'),
('Special Event', 'Special Event', 'SPECIAL', 'Special occasions and commemorative events', '#6366f1')
ON CONFLICT (code) DO NOTHING;

-- =====================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================

-- Enable RLS on all tables
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participation ENABLE ROW LEVEL SECURITY;

-- 1. Volunteers - users can only access their own records
CREATE POLICY "volunteers_own_records_only" ON volunteers
FOR ALL USING (auth_user_id = auth.uid());

-- 2. Role definitions - authenticated users can read all roles
CREATE POLICY "role_definitions_read_all" ON role_definitions
FOR SELECT USING (auth.role() = 'authenticated');

-- 3. User roles - users can see their own roles
CREATE POLICY "user_roles_own_only" ON user_roles
FOR SELECT USING (
  volunteer_id IN (
    SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
  )
);

-- Allow inserting user roles during registration
CREATE POLICY "user_roles_insert_system" ON user_roles
FOR INSERT WITH CHECK (true);

-- 4. Event categories - public read access
CREATE POLICY "event_categories_public_read" ON event_categories
FOR SELECT USING (true);

-- 5. Events - public read for active events
CREATE POLICY "events_public_read" ON events
FOR SELECT USING (is_active = true);

-- Allow creating events for authenticated users
CREATE POLICY "events_create_authenticated" ON events
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow updating own events
CREATE POLICY "events_update_own" ON events
FOR UPDATE USING (
  created_by_volunteer_id IN (
    SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
  )
);

-- 6. Event participation - users can manage their own participation
CREATE POLICY "event_participation_own_records" ON event_participation
FOR ALL USING (
  volunteer_id IN (
    SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
  )
);

-- =====================================================================================================
-- DATABASE FUNCTIONS - CORE FUNCTIONALITY
-- =====================================================================================================

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_current_volunteer();
DROP FUNCTION IF EXISTS get_events_with_stats();

-- =====================================================================
-- 1. Get Current Volunteer with Roles
-- =====================================================================
CREATE OR REPLACE FUNCTION get_current_volunteer()
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
  nss_join_year integer,
  address text,
  profile_pic text,
  is_active boolean,
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

-- =====================================================================
-- 2. Get Events with Statistics
-- =====================================================================
CREATE OR REPLACE FUNCTION get_events_with_stats()
RETURNS TABLE (
  event_id uuid,
  event_name text,
  event_description text,
  event_date timestamp with time zone,
  declared_hours integer,
  category_name text,
  category_color text,
  created_by_name text,
  participant_count bigint,
  total_declared_hours bigint,
  total_approved_hours bigint,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- =====================================================================
-- 3. Get Dashboard Statistics
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

-- =====================================================================
-- 4. Get Monthly Activity Trends (FIXED)
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

-- =====================================================================
-- 5. Get Category Distribution
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

-- =====================================================================
-- 6. Get Top Events by Impact
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

-- =====================================================================
-- 7. Get Volunteers with Stats
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

-- =====================================================================
-- 8. Get Attendance Summary
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

-- =====================================================================
-- 9. Get Event Participants
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

-- =====================================================================
-- 10. Get Volunteer Participation History
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

-- =====================================================================================================
-- ATTENDANCE TRACKING FUNCTIONS (Via Event Form)
-- =====================================================================================================

-- =====================================================================
-- 11. Mark Event Attendance
-- =====================================================================
CREATE OR REPLACE FUNCTION mark_event_attendance(
  p_event_id UUID,
  p_volunteer_ids UUID[],
  p_declared_hours NUMERIC DEFAULT 0,
  p_recorded_by UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  participants_added INTEGER,
  message TEXT
) AS $$
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
      'present',
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
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 12. Sync Event Attendance
-- =====================================================================
CREATE OR REPLACE FUNCTION sync_event_attendance(
  p_event_id UUID,
  p_selected_volunteer_ids UUID[]
)
RETURNS TABLE (
  removed_count INTEGER,
  message TEXT
) AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 13. Update Event Attendance (Combined Function)
-- =====================================================================
CREATE OR REPLACE FUNCTION update_event_attendance(
  p_event_id UUID,
  p_volunteer_ids UUID[],
  p_recorded_by UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  added INTEGER,
  removed INTEGER,
  total_present INTEGER,
  message TEXT
) AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================================================================
-- PERMISSIONS
-- =====================================================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_current_volunteer() TO authenticated;
GRANT EXECUTE ON FUNCTION get_events_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_activity_trends() TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_events_by_impact(int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteers_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_attendance_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_participants(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteer_participation_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_event_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION sync_event_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION update_event_attendance TO authenticated;

-- =====================================================================================================
-- FUNCTION DOCUMENTATION
-- =====================================================================================================

COMMENT ON FUNCTION get_current_volunteer() IS 'Returns current authenticated volunteer with their roles';
COMMENT ON FUNCTION get_events_with_stats() IS 'Returns all events with computed statistics';
COMMENT ON FUNCTION get_dashboard_stats() IS 'Returns overall dashboard statistics';
COMMENT ON FUNCTION get_monthly_activity_trends() IS 'Returns 12-month activity trends';
COMMENT ON FUNCTION get_category_distribution() IS 'Returns event distribution by category';
COMMENT ON FUNCTION get_top_events_by_impact(int) IS 'Returns top N events ranked by impact';
COMMENT ON FUNCTION get_volunteers_with_stats() IS 'Returns volunteers with participation statistics';
COMMENT ON FUNCTION get_attendance_summary() IS 'Returns events with attendance statistics';
COMMENT ON FUNCTION get_event_participants(uuid) IS 'Returns participant list for a specific event';
COMMENT ON FUNCTION get_volunteer_participation_history(uuid) IS 'Returns participation history for a volunteer';
COMMENT ON FUNCTION mark_event_attendance IS 'Marks attendance for multiple volunteers';
COMMENT ON FUNCTION sync_event_attendance IS 'Removes unmarked attendees';
COMMENT ON FUNCTION update_event_attendance IS 'Combined function to update event attendance';

-- =====================================================================================================
-- COMPLETION NOTICE
-- =====================================================================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================================================================';
    RAISE NOTICE 'NSS Dashboard Database Schema v7 - Complete Production Database';
    RAISE NOTICE '=====================================================================================================';
    RAISE NOTICE 'Tables Created: 6 (event_categories, role_definitions, volunteers, user_roles, events, event_participation)';
    RAISE NOTICE 'Functions Created: 13 (Core + Dashboard Stats + Attendance Tracking)';
    RAISE NOTICE 'RLS Policies: 9 clean, non-recursive policies';
    RAISE NOTICE 'Initial Data: 4 roles, 10 event categories';
    RAISE NOTICE 'Indexes: 10 performance-optimized indexes';
    RAISE NOTICE 'Triggers: 3 data consistency triggers';
    RAISE NOTICE 'Unique Constraints: Added to prevent duplicate event participation';
    RAISE NOTICE '';
    RAISE NOTICE 'Core Functions:';
    RAISE NOTICE '  - get_current_volunteer()';
    RAISE NOTICE '  - get_events_with_stats()';
    RAISE NOTICE '';
    RAISE NOTICE 'Dashboard Functions:';
    RAISE NOTICE '  - get_dashboard_stats()';
    RAISE NOTICE '  - get_monthly_activity_trends()';
    RAISE NOTICE '  - get_category_distribution()';
    RAISE NOTICE '  - get_top_events_by_impact()';
    RAISE NOTICE '  - get_volunteers_with_stats()';
    RAISE NOTICE '  - get_attendance_summary()';
    RAISE NOTICE '  - get_event_participants()';
    RAISE NOTICE '  - get_volunteer_participation_history()';
    RAISE NOTICE '';
    RAISE NOTICE 'Attendance Functions:';
    RAISE NOTICE '  - mark_event_attendance()';
    RAISE NOTICE '  - sync_event_attendance()';
    RAISE NOTICE '  - update_event_attendance()';
    RAISE NOTICE '';
    RAISE NOTICE 'Your NSS Dashboard v7.0.0 is ready for production!';
    RAISE NOTICE '=====================================================================================================';
END $$;
