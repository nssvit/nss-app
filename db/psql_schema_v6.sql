-- NSS Dashboard Database Schema v6
-- Complete database setup with all tables, RLS policies, functions, and data
-- Run this script in your Supabase SQL Editor to create the complete database

-- =====================================
-- EXTENSIONS
-- =====================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- TABLES
-- =====================================

-- 1. Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL CHECK (char_length(first_name) >= 2),
    last_name TEXT NOT NULL CHECK (char_length(last_name) >= 2),
    roll_number TEXT UNIQUE NOT NULL CHECK (char_length(roll_number) >= 3),
    email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    branch TEXT NOT NULL CHECK (branch IN ('EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC')),
    year TEXT NOT NULL CHECK (year IN ('FE', 'SE', 'TE')),
    phone_no TEXT CHECK (phone_no ~ '^\+?[0-9]{10,15}$'),
    birth_date DATE,
    gender TEXT CHECK (gender IN ('M', 'F', 'Prefer not to say')),
    nss_join_year INTEGER CHECK (nss_join_year >= 2020 AND nss_join_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    address TEXT,
    profile_pic TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Role Definitions Table
CREATE TABLE IF NOT EXISTS role_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    hierarchy_level INTEGER NOT NULL DEFAULT 99,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    role_definition_id UUID NOT NULL REFERENCES role_definitions(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES volunteers(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(volunteer_id, role_definition_id)
);

-- 4. Event Categories Table
CREATE TABLE IF NOT EXISTS event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name TEXT UNIQUE NOT NULL,
    category_description TEXT,
    color_code TEXT DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL CHECK (char_length(event_name) >= 5),
    event_description TEXT NOT NULL CHECK (char_length(event_description) >= 10),
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    declared_hours INTEGER NOT NULL CHECK (declared_hours > 0 AND declared_hours <= 168),
    category_id UUID NOT NULL REFERENCES event_categories(id),
    created_by_volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    registration_deadline TIMESTAMP WITH TIME ZONE,
    event_location TEXT,
    event_link TEXT,
    additional_info TEXT,
    max_participants INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Event Participation Table
CREATE TABLE IF NOT EXISTS event_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    declared_hours INTEGER DEFAULT 0 CHECK (declared_hours >= 0),
    approved_hours INTEGER CHECK (approved_hours >= 0),
    attendance_status TEXT DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'absent')),
    feedback TEXT,
    certificate_issued BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES volunteers(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, volunteer_id)
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================
CREATE INDEX IF NOT EXISTS idx_volunteers_auth_user_id ON volunteers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_roll_number ON volunteers(roll_number);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_volunteer_id ON user_roles(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_definition_id ON user_roles(role_definition_id);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by_volunteer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_participation_event_id ON event_participation(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participation_volunteer_id ON event_participation(volunteer_id);

-- =====================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_definitions_updated_at BEFORE UPDATE ON role_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_categories_updated_at BEFORE UPDATE ON event_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_participation_updated_at BEFORE UPDATE ON event_participation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- INITIAL DATA
-- =====================================

-- Insert Role Definitions
INSERT INTO role_definitions (role_name, display_name, description, permissions, hierarchy_level, is_active) VALUES
('admin', 'Administrator', 'Full system administration access', '{"read":["*"],"create":["*"],"delete":["*"],"update":["*"],"manage_roles":true}'::jsonb, 0, true),
('program_officer', 'Program Officer', 'View all data for oversight and reporting', '{"read":["*"],"create":[],"delete":[],"update":[],"manage_roles":false}'::jsonb, 10, true),
('heads', 'NSS Head', 'Event creation and participation management', '{"read":["volunteers","events","participation"],"create":["events","participation"],"delete":["events"],"update":["events","participation"],"manage_roles":false}'::jsonb, 20, true),
('volunteer', 'Volunteer', 'Basic volunteer with limited access to view own profile and participate in events', '{"can_view_own_profile":true,"can_participate_events":true,"can_request_hour_review":true}'::jsonb, 1, true)
ON CONFLICT (role_name) DO NOTHING;

-- Insert Event Categories
INSERT INTO event_categories (category_name, category_description, color_code, is_active) VALUES
('Area Based - 1', 'Community development projects in assigned areas', '#3b82f6', true),
('Area Based - 2', 'Advanced community development initiatives', '#1d4ed8', true),
('Camp', 'Multi-day residential service camps', '#059669', true),
('College Event', 'Campus-based NSS activities and programs', '#dc2626', true),
('Workshop', 'Skill development and awareness workshops', '#7c3aed', true),
('Blood Donation', 'Blood donation drives and health awareness', '#ea580c', true),
('Environment', 'Environmental conservation and awareness programs', '#16a34a', true),
('Educational', 'Literacy and educational support programs', '#0891b2', true),
('Health & Hygiene', 'Health awareness and hygiene promotion', '#be123c', true),
('Special Event', 'Special occasions and commemorative events', '#6366f1', true)
ON CONFLICT (category_name) DO NOTHING;

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "volunteers_insert_policy" ON volunteers;
DROP POLICY IF EXISTS "volunteers_select_policy" ON volunteers;
DROP POLICY IF EXISTS "volunteers_update_policy" ON volunteers;
DROP POLICY IF EXISTS "role_definitions_select_policy" ON role_definitions;
DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
DROP POLICY IF EXISTS "event_categories_select_policy" ON event_categories;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "event_participation_select_policy" ON event_participation;
DROP POLICY IF EXISTS "event_participation_insert_policy" ON event_participation;
DROP POLICY IF EXISTS "event_participation_update_policy" ON event_participation;

-- 1. Volunteers table policies
CREATE POLICY "volunteers_insert_policy" ON volunteers
FOR INSERT WITH CHECK (true); -- Allow anyone to register

CREATE POLICY "volunteers_select_policy" ON volunteers
FOR SELECT USING (
  auth.uid() = auth_user_id OR
  auth.uid() IN (
    SELECT v.auth_user_id FROM volunteers v
    JOIN user_roles ur ON v.id = ur.volunteer_id
    JOIN role_definitions rd ON ur.role_definition_id = rd.id
    WHERE rd.role_name IN ('admin', 'program_officer', 'heads')
    AND ur.is_active = true AND rd.is_active = true
  )
);

CREATE POLICY "volunteers_update_policy" ON volunteers
FOR UPDATE USING (
  auth.uid() = auth_user_id OR
  auth.uid() IN (
    SELECT v.auth_user_id FROM volunteers v
    JOIN user_roles ur ON v.id = ur.volunteer_id
    JOIN role_definitions rd ON ur.role_definition_id = rd.id
    WHERE rd.role_name IN ('admin', 'program_officer')
    AND ur.is_active = true AND rd.is_active = true
  )
);

-- 2. Role definitions - read-only for active roles
CREATE POLICY "role_definitions_select_policy" ON role_definitions
FOR SELECT USING (is_active = true);

-- 3. User roles policies
CREATE POLICY "user_roles_select_policy" ON user_roles
FOR SELECT USING (
  volunteer_id IN (
    SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
  ) OR
  auth.uid() IN (
    SELECT v.auth_user_id FROM volunteers v
    JOIN user_roles ur ON v.id = ur.volunteer_id
    JOIN role_definitions rd ON ur.role_definition_id = rd.id
    WHERE rd.role_name IN ('admin', 'program_officer')
    AND ur.is_active = true AND rd.is_active = true
  )
);

CREATE POLICY "user_roles_insert_policy" ON user_roles
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT v.auth_user_id FROM volunteers v
    JOIN user_roles ur ON v.id = ur.volunteer_id
    JOIN role_definitions rd ON ur.role_definition_id = rd.id
    WHERE rd.role_name = 'admin'
    AND ur.is_active = true AND rd.is_active = true
  )
);

CREATE POLICY "user_roles_update_policy" ON user_roles
FOR UPDATE USING (
  auth.uid() IN (
    SELECT v.auth_user_id FROM volunteers v
    JOIN user_roles ur ON v.id = ur.volunteer_id
    JOIN role_definitions rd ON ur.role_definition_id = rd.id
    WHERE rd.role_name = 'admin'
    AND ur.is_active = true AND rd.is_active = true
  )
);

-- 4. Event categories - public read access
CREATE POLICY "event_categories_select_policy" ON event_categories
FOR SELECT USING (is_active = true);

-- 5. Events policies
CREATE POLICY "events_select_policy" ON events
FOR SELECT USING (is_active = true);

CREATE POLICY "events_insert_policy" ON events
FOR INSERT WITH CHECK (
  created_by_volunteer_id IN (
    SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "events_update_policy" ON events
FOR UPDATE USING (
  created_by_volunteer_id IN (
    SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
  ) OR
  auth.uid() IN (
    SELECT v.auth_user_id FROM volunteers v
    JOIN user_roles ur ON v.id = ur.volunteer_id
    JOIN role_definitions rd ON ur.role_definition_id = rd.id
    WHERE rd.role_name IN ('admin', 'program_officer', 'heads')
    AND ur.is_active = true AND rd.is_active = true
  )
);

-- 6. Event participation policies
CREATE POLICY "event_participation_select_policy" ON event_participation
FOR SELECT USING (
  volunteer_id IN (
    SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
  ) OR
  auth.uid() IN (
    SELECT v.auth_user_id FROM volunteers v
    JOIN user_roles ur ON v.id = ur.volunteer_id
    JOIN role_definitions rd ON ur.role_definition_id = rd.id
    WHERE rd.role_name IN ('admin', 'program_officer', 'heads')
    AND ur.is_active = true AND rd.is_active = true
  )
);

CREATE POLICY "event_participation_insert_policy" ON event_participation
FOR INSERT WITH CHECK (
  volunteer_id IN (
    SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "event_participation_update_policy" ON event_participation
FOR UPDATE USING (
  volunteer_id IN (
    SELECT id FROM volunteers WHERE auth_user_id = auth.uid()
  ) OR
  auth.uid() IN (
    SELECT v.auth_user_id FROM volunteers v
    JOIN user_roles ur ON v.id = ur.volunteer_id
    JOIN role_definitions rd ON ur.role_definition_id = rd.id
    WHERE rd.role_name IN ('admin', 'program_officer', 'heads')
    AND ur.is_active = true AND rd.is_active = true
  )
);

-- =====================================
-- DATABASE FUNCTIONS
-- =====================================

-- 1. Function to get current volunteer with roles
CREATE OR REPLACE FUNCTION get_current_volunteer()
RETURNS TABLE (
  volunteer_id uuid,
  auth_user_id uuid,
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
    v.auth_user_id::uuid,
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
      ARRAY_AGG(DISTINCT rd.role_name) FILTER (WHERE rd.role_name IS NOT NULL),
      '{}'::text[]
    ) as roles
  FROM volunteers v
  LEFT JOIN user_roles ur ON v.id = ur.volunteer_id AND ur.is_active = true
  LEFT JOIN role_definitions rd ON ur.role_definition_id = rd.id AND rd.is_active = true
  WHERE v.auth_user_id = auth.uid()
    AND v.is_active = true
  GROUP BY v.id, v.auth_user_id, v.first_name, v.last_name, v.roll_number,
           v.email, v.branch, v.year, v.phone_no, v.birth_date, v.gender,
           v.nss_join_year, v.address, v.profile_pic, v.is_active;
END;
$$;

-- 2. Function to get events with participation stats
CREATE OR REPLACE FUNCTION get_events_with_stats()
RETURNS TABLE (
  event_id uuid,
  event_name text,
  event_description text,
  event_date timestamp,
  declared_hours integer,
  category_name text,
  created_by_name text,
  participant_count bigint,
  is_active boolean,
  created_at timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    e.event_name,
    e.event_description,
    e.event_date,
    e.declared_hours,
    ec.category_name,
    (v.first_name || ' ' || v.last_name) as created_by_name,
    COUNT(ep.volunteer_id) as participant_count,
    e.is_active,
    e.created_at
  FROM events e
  LEFT JOIN event_categories ec ON e.category_id = ec.id
  LEFT JOIN volunteers v ON e.created_by_volunteer_id = v.id
  LEFT JOIN event_participation ep ON e.id = ep.event_id
  WHERE e.is_active = true
  GROUP BY e.id, e.event_name, e.event_description, e.event_date, e.declared_hours,
           ec.category_name, v.first_name, v.last_name, e.is_active, e.created_at
  ORDER BY e.created_at DESC;
END;
$$;

-- 3. Function to get volunteer hours summary
CREATE OR REPLACE FUNCTION get_volunteer_hours_summary()
RETURNS TABLE (
  volunteer_id uuid,
  volunteer_name text,
  total_hours integer,
  approved_hours integer,
  events_count integer,
  last_activity timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 4. Function to create new event
CREATE OR REPLACE FUNCTION create_event(
  p_event_name text,
  p_event_description text,
  p_event_date timestamp,
  p_declared_hours integer,
  p_category_id uuid,
  p_event_location text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 5. Function to register for event
CREATE OR REPLACE FUNCTION register_for_event(
  p_event_id uuid,
  p_declared_hours integer DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_current_volunteer() TO authenticated;
GRANT EXECUTE ON FUNCTION get_events_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteer_hours_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION create_event(text, text, timestamp, integer, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION register_for_event(uuid, integer) TO authenticated;

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- Verify tables were created
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('volunteers', 'role_definitions', 'user_roles', 'event_categories', 'events', 'event_participation')
ORDER BY tablename;

-- Verify functions were created
SELECT proname as function_name
FROM pg_proc
WHERE proname IN ('get_current_volunteer', 'get_events_with_stats', 'get_volunteer_hours_summary', 'create_event', 'register_for_event')
ORDER BY proname;

-- Verify initial data
SELECT role_name, display_name, hierarchy_level FROM role_definitions ORDER BY hierarchy_level;
SELECT category_name, color_code FROM event_categories WHERE is_active = true ORDER BY category_name;

-- =====================================
-- COMPLETION MESSAGE
-- =====================================
DO $$
BEGIN
    RAISE NOTICE 'NSS Dashboard Database Schema v6 setup completed successfully!';
    RAISE NOTICE 'Tables created: volunteers, role_definitions, user_roles, event_categories, events, event_participation';
    RAISE NOTICE 'Functions created: get_current_volunteer, get_events_with_stats, get_volunteer_hours_summary, create_event, register_for_event';
    RAISE NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Initial data inserted for roles and categories';
    RAISE NOTICE 'Your NSS Dashboard is ready to use!';
END $$;