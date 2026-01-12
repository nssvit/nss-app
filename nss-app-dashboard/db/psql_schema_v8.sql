-- =====================================================================================================
-- NSS Dashboard Database Schema v8 - Complete Production Database
-- =====================================================================================================
-- This is a complete, consolidated database schema for NSS Dashboard
-- Run this script in your Supabase SQL Editor to set up the complete database
--
-- Version: 8.0.0
-- Updated: 2026-01-12
-- Changes from v7:
--   - Fixed UUID generation for Supabase compatibility (extensions.uuid_generate_v4)
--   - Added missing get_user_stats() function (CRITICAL - used by app)
--   - Added missing get_volunteer_hours_summary() function (CRITICAL - used by app)
--   - Added utility functions: has_role, has_any_role, can_register_for_event, create_event, register_for_event
--   - Added comprehensive indexes (24+) for performance
--   - Added foreign key CASCADE/RESTRICT rules
--   - Added views: event_summary, role_management, volunteer_summary
--   - Updated schema comment to v8
--   - Removed realtime broadcast triggers (app uses postgres_changes directly)
-- =====================================================================================================

-- =====================================
-- SCHEMA COMMENT
-- =====================================
COMMENT ON SCHEMA public IS 'NSS Dashboard Database Schema v8 - Production Ready';

-- =====================================
-- EXTENSIONS
-- =====================================
-- Note: These may already exist in Supabase, using IF NOT EXISTS for safety
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA extensions;

-- =====================================
-- HELPER FUNCTION: trigger_set_updated_at
-- =====================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- TABLES
-- =====================================

-- 1. Event Categories Table
CREATE TABLE IF NOT EXISTS public.event_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM name)) > 0),
  category_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM code)) > 0),
  description TEXT,
  color_hex TEXT CHECK (color_hex IS NULL OR color_hex ~* '^#[0-9A-F]{6}$'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.event_categories IS 'Event type definitions with color coding';

-- 2. Role Definitions Table
CREATE TABLE IF NOT EXISTS public.role_definitions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  role_name TEXT NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM role_name)) > 0),
  display_name TEXT NOT NULL CHECK (length(TRIM(BOTH FROM display_name)) > 0),
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  hierarchy_level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.role_definitions IS 'Centralized role definitions with permissions - SCALABLE';

-- 3. Volunteers Table
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
  CONSTRAINT volunteers_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.volunteers IS 'Universal volunteer table - everyone is a volunteer first';

-- 4. User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  volunteer_id UUID NOT NULL,
  role_definition_id UUID NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_role_definition_id_fkey FOREIGN KEY (role_definition_id) REFERENCES public.role_definitions(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.volunteers(id) ON DELETE SET NULL,
  CONSTRAINT user_roles_volunteer_id_role_definition_id_key UNIQUE (volunteer_id, role_definition_id)
);

COMMENT ON TABLE public.user_roles IS 'Role assignments to volunteers - clean separation of concerns';

-- 5. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(TRIM(BOTH FROM name)) > 0),
  event_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE,
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
  CONSTRAINT events_check CHECK (end_date >= start_date),
  CONSTRAINT events_check1 CHECK ((min_participants IS NULL) OR (max_participants IS NULL) OR (min_participants <= max_participants)),
  CONSTRAINT events_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.event_categories(id),
  CONSTRAINT events_created_by_volunteer_id_fkey FOREIGN KEY (created_by_volunteer_id) REFERENCES public.volunteers(id) ON DELETE RESTRICT
);

COMMENT ON TABLE public.events IS 'Enhanced events with multi-day support, capacity management, and status workflow';

-- 6. Event Participation Table
CREATE TABLE IF NOT EXISTS public.event_participation (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  event_id UUID NOT NULL,
  volunteer_id UUID NOT NULL,
  hours_attended INTEGER NOT NULL CHECK (hours_attended >= 0),
  declared_hours INTEGER DEFAULT 0 CHECK (declared_hours >= 0),
  approved_hours INTEGER CHECK (approved_hours >= 0),
  participation_status TEXT NOT NULL DEFAULT 'registered'::text CHECK (participation_status = ANY (ARRAY['registered'::text, 'present'::text, 'absent'::text, 'partially_present'::text, 'excused'::text])),
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attendance_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  feedback TEXT,
  recorded_by_volunteer_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT event_participation_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_participation_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE,
  CONSTRAINT event_participation_recorded_by_volunteer_id_fkey FOREIGN KEY (recorded_by_volunteer_id) REFERENCES public.volunteers(id) ON DELETE RESTRICT,
  CONSTRAINT event_participation_event_id_volunteer_id_key UNIQUE (event_id, volunteer_id)
);

COMMENT ON TABLE public.event_participation IS 'Comprehensive participation tracking with registration workflow';

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Volunteers indexes
CREATE INDEX IF NOT EXISTS idx_volunteers_auth_user ON public.volunteers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON public.volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_roll_number ON public.volunteers(roll_number);
CREATE INDEX IF NOT EXISTS idx_volunteers_branch ON public.volunteers(branch);
CREATE INDEX IF NOT EXISTS idx_volunteers_year ON public.volunteers(year);
CREATE INDEX IF NOT EXISTS idx_volunteers_active ON public.volunteers(is_active) WHERE (is_active = true);

-- Role definitions indexes
CREATE INDEX IF NOT EXISTS idx_role_definitions_name ON public.role_definitions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_definitions_hierarchy ON public.role_definitions(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_role_definitions_active ON public.role_definitions(is_active) WHERE (is_active = true);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_volunteer ON public.user_roles(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_def ON public.user_roles(role_definition_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires ON public.user_roles(expires_at) WHERE (expires_at IS NOT NULL);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by_volunteer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(event_status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON public.events(end_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active) WHERE (is_active = true);

-- Event participation indexes
CREATE INDEX IF NOT EXISTS idx_participation_event ON public.event_participation(event_id);
CREATE INDEX IF NOT EXISTS idx_participation_volunteer ON public.event_participation(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_participation_status ON public.event_participation(participation_status);
CREATE INDEX IF NOT EXISTS idx_participation_registration ON public.event_participation(registration_date);
CREATE INDEX IF NOT EXISTS idx_event_participation_status ON public.event_participation(event_id, participation_status);
CREATE INDEX IF NOT EXISTS idx_event_participation_volunteer ON public.event_participation(volunteer_id, participation_status);

-- =====================================
-- TRIGGERS - Data Consistency
-- =====================================

-- Updated_at triggers
CREATE TRIGGER set_event_categories_updated_at
  BEFORE UPDATE ON public.event_categories
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_role_definitions_updated_at
  BEFORE UPDATE ON public.role_definitions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_volunteers_updated_at
  BEFORE UPDATE ON public.volunteers
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_participation_updated_at
  BEFORE UPDATE ON public.event_participation
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Sync name columns for event_categories
CREATE OR REPLACE FUNCTION public.sync_event_categories_names()
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
  BEFORE INSERT OR UPDATE ON public.event_categories
  FOR EACH ROW EXECUTE FUNCTION public.sync_event_categories_names();

-- Sync name columns for events
CREATE OR REPLACE FUNCTION public.sync_events_names()
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
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.sync_events_names();

-- Sync hours columns for event_participation
CREATE OR REPLACE FUNCTION public.sync_participation_hours()
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
  BEFORE INSERT OR UPDATE ON public.event_participation
  FOR EACH ROW EXECUTE FUNCTION public.sync_participation_hours();

-- =====================================================================================================
-- DATABASE FUNCTIONS - CORE
-- =====================================================================================================

-- =====================================================================
-- 1. Get Current Volunteer with Roles
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_current_volunteer()
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
        FROM public.user_roles ur
        JOIN public.role_definitions rd ON ur.role_definition_id = rd.id
        WHERE ur.volunteer_id = v.id
          AND ur.is_active = true
          AND rd.is_active = true
      ),
      ARRAY['volunteer'::text]
    ) as roles
  FROM public.volunteers v
  WHERE v.auth_user_id = auth.uid()
    AND v.is_active = true;
END;
$$;

COMMENT ON FUNCTION public.get_current_volunteer() IS 'Returns current authenticated volunteer with their roles';

-- =====================================================================
-- 2. Get Events with Statistics
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_events_with_stats()
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
  FROM public.events e
  LEFT JOIN public.event_categories ec ON e.category_id = ec.id
  LEFT JOIN public.volunteers v ON e.created_by_volunteer_id = v.id
  LEFT JOIN public.event_participation ep ON e.id = ep.event_id
  WHERE e.is_active = true
  GROUP BY e.id, e.event_name, e.name, e.description, e.event_date, e.start_date, e.declared_hours,
           ec.category_name, ec.name, ec.color_hex, v.first_name, v.last_name, e.is_active
  ORDER BY COALESCE(e.event_date, e.start_date::timestamp with time zone) DESC;
END;
$$;

-- =====================================================================================================
-- DATABASE FUNCTIONS - DASHBOARD STATISTICS
-- =====================================================================================================

-- =====================================================================
-- 3. Get Dashboard Statistics
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
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
    (SELECT COUNT(*) FROM public.events WHERE is_active = true) as total_events,
    (SELECT COUNT(*) FROM public.volunteers WHERE is_active = true) as active_volunteers,
    (SELECT COALESCE(SUM(hours_attended), 0) FROM public.event_participation) as total_hours,
    (SELECT COUNT(*) FROM public.events WHERE event_status = 'ongoing' AND is_active = true) as ongoing_projects;
END;
$$;

COMMENT ON FUNCTION public.get_dashboard_stats() IS 'Returns overall statistics: total events, active volunteers, total hours, and ongoing projects';

-- =====================================================================
-- 4. Get Monthly Activity Trends
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_monthly_activity_trends()
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
  FROM public.events e
  LEFT JOIN public.event_participation ep ON e.id = ep.event_id
  WHERE e.is_active = true
    AND e.start_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', e.start_date)
  ORDER BY DATE_TRUNC('month', e.start_date);
END;
$$;

COMMENT ON FUNCTION public.get_monthly_activity_trends() IS 'Returns 12-month activity trends with events, volunteers, and hours aggregated by month';

-- =====================================================================
-- 5. Get Category Distribution
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_category_distribution()
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
  FROM public.event_categories ec
  LEFT JOIN public.events e ON e.category_id = ec.id AND e.is_active = true
  LEFT JOIN public.event_participation ep ON e.id = ep.event_id
  WHERE ec.is_active = true
  GROUP BY ec.id, ec.name, ec.color_hex
  ORDER BY event_count DESC;
END;
$$;

COMMENT ON FUNCTION public.get_category_distribution() IS 'Returns event distribution by category with counts, participants, and total hours';

-- =====================================================================
-- 6. Get Top Events by Impact
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_top_events_by_impact(limit_count int DEFAULT 5)
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
  FROM public.events e
  LEFT JOIN public.event_categories ec ON e.category_id = ec.id
  LEFT JOIN public.event_participation ep ON e.id = ep.event_id
  WHERE e.is_active = true
  GROUP BY e.id, e.name, e.event_date, ec.name, e.event_status
  ORDER BY total_hours DESC, participant_count DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.get_top_events_by_impact(int) IS 'Returns top N events ranked by total hours and participation';

-- =====================================================================================================
-- DATABASE FUNCTIONS - VOLUNTEERS
-- =====================================================================================================

-- =====================================================================
-- 7. Get Volunteers with Stats
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_volunteers_with_stats()
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
        FROM public.user_roles ur
        JOIN public.role_definitions rd ON ur.role_definition_id = rd.id
        WHERE ur.volunteer_id = v.id AND ur.is_active = true
      ),
      ARRAY['volunteer'::text]
    ) as roles
  FROM public.volunteers v
  LEFT JOIN public.event_participation ep ON v.id = ep.volunteer_id
  WHERE v.is_active = true
  GROUP BY v.id
  ORDER BY v.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_volunteers_with_stats() IS 'Returns all volunteers with computed participation stats and roles';

-- =====================================================================
-- 8. Get User Stats (CRITICAL - Was missing from v7)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  total_users integer,
  active_users integer,
  pending_users integer,
  admin_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.volunteers) as total_users,
    (SELECT COUNT(*)::INTEGER FROM public.volunteers WHERE is_active = true) as active_users,
    0::INTEGER as pending_users,
    (SELECT COUNT(DISTINCT ur.volunteer_id)::INTEGER
     FROM public.user_roles ur
     JOIN public.role_definitions rd ON ur.role_definition_id = rd.id
     WHERE rd.role_name = 'admin' AND ur.is_active = true) as admin_count;
END;
$$;

COMMENT ON FUNCTION public.get_user_stats() IS 'Returns user statistics for UserManagementPage';

-- =====================================================================
-- 9. Get Volunteer Hours Summary (CRITICAL - Was missing from v7)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_volunteer_hours_summary()
RETURNS TABLE (
  volunteer_id uuid,
  volunteer_name text,
  total_hours integer,
  approved_hours integer,
  events_count integer,
  last_activity timestamp without time zone
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
    MAX(ep.updated_at)::timestamp without time zone as last_activity
  FROM public.volunteers v
  LEFT JOIN public.event_participation ep ON v.id = ep.volunteer_id
  LEFT JOIN public.events e ON ep.event_id = e.id AND e.is_active = true
  WHERE v.is_active = true
  GROUP BY v.id, v.first_name, v.last_name
  HAVING COUNT(ep.id) > 0
  ORDER BY total_hours DESC;
END;
$$;

COMMENT ON FUNCTION public.get_volunteer_hours_summary() IS 'Returns volunteer hours summary for HeadsDashboard';

-- =====================================================================================================
-- DATABASE FUNCTIONS - ATTENDANCE
-- =====================================================================================================

-- =====================================================================
-- 10. Get Attendance Summary
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_attendance_summary()
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
  FROM public.events e
  LEFT JOIN public.event_categories ec ON e.category_id = ec.id
  LEFT JOIN public.event_participation ep ON e.id = ep.event_id
  WHERE e.is_active = true
  GROUP BY e.id, e.name, e.event_date, ec.name
  ORDER BY e.event_date DESC;
END;
$$;

COMMENT ON FUNCTION public.get_attendance_summary() IS 'Returns events with attendance statistics and rates';

-- =====================================================================
-- 11. Get Event Participants
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_event_participants(event_uuid uuid)
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
  FROM public.event_participation ep
  JOIN public.volunteers v ON ep.volunteer_id = v.id
  WHERE ep.event_id = event_uuid
  ORDER BY ep.registration_date DESC;
END;
$$;

COMMENT ON FUNCTION public.get_event_participants(uuid) IS 'Returns detailed participant list for a specific event';

-- =====================================================================
-- 12. Get Volunteer Participation History
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_volunteer_participation_history(volunteer_uuid uuid)
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
  FROM public.event_participation ep
  JOIN public.events e ON ep.event_id = e.id
  JOIN public.event_categories ec ON e.category_id = ec.id
  WHERE ep.volunteer_id = volunteer_uuid
    AND e.is_active = true
  ORDER BY e.event_date DESC;
END;
$$;

COMMENT ON FUNCTION public.get_volunteer_participation_history(uuid) IS 'Returns participation history for a specific volunteer';

-- =====================================================================================================
-- DATABASE FUNCTIONS - ATTENDANCE TRACKING
-- =====================================================================================================

-- =====================================================================
-- 13. Mark Event Attendance
-- =====================================================================
CREATE OR REPLACE FUNCTION public.mark_event_attendance(
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
  IF p_declared_hours = 0 THEN
    SELECT declared_hours INTO v_event_hours
    FROM public.events
    WHERE id = p_event_id;

    p_declared_hours := COALESCE(v_event_hours, 0);
  END IF;

  FOREACH v_volunteer_id IN ARRAY p_volunteer_ids
  LOOP
    INSERT INTO public.event_participation (
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
-- 14. Sync Event Attendance
-- =====================================================================
CREATE OR REPLACE FUNCTION public.sync_event_attendance(
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
  DELETE FROM public.event_participation
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
-- 15. Update Event Attendance (Combined Function)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.update_event_attendance(
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
  SELECT declared_hours INTO v_declared_hours
  FROM public.events
  WHERE id = p_event_id;

  SELECT removed_count INTO v_removed
  FROM public.sync_event_attendance(p_event_id, p_volunteer_ids);

  SELECT participants_added INTO v_added
  FROM public.mark_event_attendance(p_event_id, p_volunteer_ids, v_declared_hours, p_recorded_by);

  SELECT COUNT(*)::INTEGER INTO v_total
  FROM public.event_participation
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
-- DATABASE FUNCTIONS - UTILITY
-- =====================================================================================================

-- =====================================================================
-- 16. Has Role
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_role(p_role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

COMMENT ON FUNCTION public.has_role(text) IS 'Robust role checking using centralized role definitions';

-- =====================================================================
-- 17. Has Any Role
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_any_role(VARIADIC p_role_names text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

COMMENT ON FUNCTION public.has_any_role(text[]) IS 'Scalable multi-role checking function';

-- =====================================================================
-- 18. Can Register For Event
-- =====================================================================
CREATE OR REPLACE FUNCTION public.can_register_for_event(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    event_max_participants INT;
    current_participants INT;
    event_registration_deadline TIMESTAMPTZ;
    event_status_value TEXT;
BEGIN
    SELECT max_participants, registration_deadline, event_status
    INTO event_max_participants, event_registration_deadline, event_status_value
    FROM public.events
    WHERE id = p_event_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF event_status_value NOT IN ('planned', 'registration_open') THEN
        RETURN FALSE;
    END IF;

    IF event_registration_deadline IS NOT NULL AND event_registration_deadline < now() THEN
        RETURN FALSE;
    END IF;

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

COMMENT ON FUNCTION public.can_register_for_event(uuid) IS 'Event capacity and registration validation';

-- =====================================================================
-- 19. Create Event
-- =====================================================================
CREATE OR REPLACE FUNCTION public.create_event(
  p_event_name text,
  p_event_description text,
  p_event_date timestamp without time zone,
  p_declared_hours integer,
  p_category_id integer,
  p_event_location text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_volunteer_id uuid;
  v_event_id uuid;
BEGIN
  SELECT id INTO v_volunteer_id
  FROM public.volunteers
  WHERE auth_user_id = auth.uid() AND is_active = true;

  IF v_volunteer_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not active';
  END IF;

  INSERT INTO public.events (
    name,
    event_name,
    description,
    start_date,
    end_date,
    event_date,
    declared_hours,
    category_id,
    created_by_volunteer_id,
    location,
    is_active
  )
  VALUES (
    p_event_name,
    p_event_name,
    p_event_description,
    p_event_date::date,
    p_event_date::date,
    p_event_date,
    p_declared_hours,
    p_category_id,
    v_volunteer_id,
    p_event_location,
    true
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- =====================================================================
-- 20. Register For Event
-- =====================================================================
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id uuid,
  p_declared_hours integer DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_volunteer_id uuid;
BEGIN
  SELECT id INTO v_volunteer_id
  FROM public.volunteers
  WHERE auth_user_id = auth.uid() AND is_active = true;

  IF v_volunteer_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not active';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.event_participation
    WHERE event_id = p_event_id AND volunteer_id = v_volunteer_id
  ) THEN
    RAISE EXCEPTION 'Already registered for this event';
  END IF;

  INSERT INTO public.event_participation (
    event_id,
    volunteer_id,
    declared_hours,
    hours_attended,
    recorded_by_volunteer_id
  )
  VALUES (
    p_event_id,
    v_volunteer_id,
    p_declared_hours,
    0,
    v_volunteer_id
  );

  RETURN true;
END;
$$;

-- =====================================================================================================
-- VIEWS
-- =====================================================================================================

-- =====================================================================
-- Event Summary View
-- =====================================================================
CREATE OR REPLACE VIEW public.event_summary AS
SELECT
  e.id,
  e.name,
  e.description,
  e.start_date,
  e.end_date,
  ((e.end_date - e.start_date) + 1) AS duration_days,
  e.declared_hours,
  ec.name AS category,
  ec.color_hex AS category_color,
  e.min_participants,
  e.max_participants,
  e.event_status,
  e.location,
  e.registration_deadline,
  count(DISTINCT ep.id) AS total_participants,
  count(DISTINCT CASE WHEN (ep.participation_status = 'registered') THEN ep.id ELSE NULL END) AS registered_count,
  count(DISTINCT CASE WHEN (ep.participation_status = 'present') THEN ep.id ELSE NULL END) AS present_count,
  count(DISTINCT CASE WHEN (ep.participation_status = 'absent') THEN ep.id ELSE NULL END) AS absent_count,
  count(DISTINCT CASE WHEN (ep.participation_status = 'partially_present') THEN ep.id ELSE NULL END) AS partial_count,
  CASE
    WHEN (e.max_participants IS NOT NULL) THEN
      round((((count(DISTINCT CASE WHEN (ep.participation_status = ANY (ARRAY['registered', 'present', 'partially_present'])) THEN ep.id ELSE NULL END))::numeric * 100.0) / (e.max_participants)::numeric), 2)
    ELSE NULL
  END AS capacity_percentage,
  CASE
    WHEN (e.max_participants IS NOT NULL) THEN
      (e.max_participants - count(DISTINCT CASE WHEN (ep.participation_status = ANY (ARRAY['registered', 'present', 'partially_present'])) THEN ep.id ELSE NULL END))
    ELSE NULL
  END AS available_slots,
  COALESCE(avg(ep.hours_attended), 0) AS avg_hours_attended,
  COALESCE(sum(ep.hours_attended), 0) AS total_hours_logged,
  ((cv.first_name || ' ') || cv.last_name) AS created_by,
  e.created_at,
  e.updated_at
FROM (((public.events e
  LEFT JOIN public.event_categories ec ON ((e.category_id = ec.id)))
  LEFT JOIN public.event_participation ep ON ((e.id = ep.event_id)))
  LEFT JOIN public.volunteers cv ON ((e.created_by_volunteer_id = cv.id)))
WHERE (e.is_active = true)
GROUP BY e.id, e.name, e.description, e.start_date, e.end_date, e.declared_hours, ec.name, ec.color_hex, e.min_participants, e.max_participants, e.event_status, e.location, e.registration_deadline, cv.first_name, cv.last_name, e.created_at, e.updated_at;

COMMENT ON VIEW public.event_summary IS 'Comprehensive event analytics with capacity tracking';

-- =====================================================================
-- Role Management View
-- =====================================================================
CREATE OR REPLACE VIEW public.role_management AS
SELECT
  v.id AS volunteer_id,
  ((v.first_name || ' ') || v.last_name) AS volunteer_name,
  v.roll_number,
  v.email,
  v.branch,
  v.year,
  ur.id AS assignment_id,
  rd.role_name,
  rd.display_name AS role_display_name,
  rd.hierarchy_level,
  ur.assigned_at,
  ur.expires_at,
  ur.is_active AS assignment_active,
  ((av.first_name || ' ') || av.last_name) AS assigned_by_name
FROM (((public.volunteers v
  LEFT JOIN public.user_roles ur ON ((v.id = ur.volunteer_id)))
  LEFT JOIN public.role_definitions rd ON ((ur.role_definition_id = rd.id)))
  LEFT JOIN public.volunteers av ON ((ur.assigned_by = av.id)))
WHERE (v.is_active = true)
ORDER BY v.roll_number, rd.hierarchy_level;

-- =====================================================================
-- Volunteer Summary View
-- =====================================================================
CREATE OR REPLACE VIEW public.volunteer_summary AS
SELECT
  v.id,
  v.first_name,
  v.last_name,
  ((v.first_name || ' ') || v.last_name) AS full_name,
  v.roll_number,
  v.email,
  v.branch,
  v.year,
  v.phone_no,
  v.nss_join_year,
  v.is_active,
  COALESCE(array_agg(rd.role_name ORDER BY rd.hierarchy_level) FILTER (WHERE (rd.role_name IS NOT NULL)), ARRAY[]::text[]) AS roles,
  COALESCE(array_agg(rd.display_name ORDER BY rd.hierarchy_level) FILTER (WHERE (rd.display_name IS NOT NULL)), ARRAY[]::text[]) AS role_display_names,
  min(rd.hierarchy_level) AS highest_role_level,
  count(DISTINCT ep.id) AS total_events_participated,
  COALESCE(sum(ep.hours_attended), 0) AS total_hours_completed,
  count(DISTINCT CASE WHEN (ep.participation_status = 'present') THEN ep.id ELSE NULL END) AS events_attended,
  count(DISTINCT CASE WHEN (ep.participation_status = 'absent') THEN ep.id ELSE NULL END) AS events_missed,
  count(DISTINCT CASE WHEN (ep.participation_status = 'registered') THEN ep.id ELSE NULL END) AS events_registered,
  max(e.end_date) AS last_event_date,
  v.created_at,
  v.updated_at
FROM ((((public.volunteers v
  LEFT JOIN public.user_roles ur ON (((v.id = ur.volunteer_id) AND (ur.is_active = true) AND ((ur.expires_at IS NULL) OR (ur.expires_at > now())))))
  LEFT JOIN public.role_definitions rd ON (((ur.role_definition_id = rd.id) AND (rd.is_active = true))))
  LEFT JOIN public.event_participation ep ON ((v.id = ep.volunteer_id)))
  LEFT JOIN public.events e ON (((ep.event_id = e.id) AND (e.is_active = true))))
GROUP BY v.id, v.first_name, v.last_name, v.roll_number, v.email, v.branch, v.year, v.phone_no, v.nss_join_year, v.is_active, v.created_at, v.updated_at;

COMMENT ON VIEW public.volunteer_summary IS 'Complete volunteer information with enhanced role details';

-- =====================================================================================================
-- INITIAL DATA
-- =====================================================================================================

-- Insert role definitions
INSERT INTO public.role_definitions (role_name, display_name, description, hierarchy_level, permissions)
VALUES
  ('admin', 'Administrator', 'Full system access with all permissions', 1, '{"all": true, "users": true, "events": true, "roles": true, "system": true}'),
  ('program_officer', 'Program Officer', 'Event and user management capabilities', 2, '{"events": true, "users": true, "reports": true, "participation": true}'),
  ('heads', 'Head/Lead', 'Team leadership and event coordination', 3, '{"events": true, "team": true, "participation": true, "reports": true}'),
  ('volunteer', 'Volunteer', 'Basic volunteer access and profile management', 4, '{"profile": true, "events_view": true, "participation": true}')
ON CONFLICT (role_name) DO NOTHING;

-- Insert event categories
INSERT INTO public.event_categories (name, category_name, code, description, color_hex)
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

-- =====================================================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================================================

-- Enable RLS on all tables
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (for idempotency)
DROP POLICY IF EXISTS "volunteers_own_records_only" ON public.volunteers;
DROP POLICY IF EXISTS "role_definitions_read_all" ON public.role_definitions;
DROP POLICY IF EXISTS "user_roles_own_only" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_system" ON public.user_roles;
DROP POLICY IF EXISTS "event_categories_public_read" ON public.event_categories;
DROP POLICY IF EXISTS "events_public_read" ON public.events;
DROP POLICY IF EXISTS "events_create_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_update_own" ON public.events;
DROP POLICY IF EXISTS "event_participation_own_records" ON public.event_participation;

-- 1. Volunteers - users can only access their own records
CREATE POLICY "volunteers_own_records_only" ON public.volunteers
FOR ALL USING (auth_user_id = auth.uid());

-- 2. Role definitions - authenticated users can read all roles
CREATE POLICY "role_definitions_read_all" ON public.role_definitions
FOR SELECT USING (auth.role() = 'authenticated');

-- 3. User roles - users can see their own roles
CREATE POLICY "user_roles_own_only" ON public.user_roles
FOR SELECT USING (
  volunteer_id IN (
    SELECT id FROM public.volunteers WHERE auth_user_id = auth.uid()
  )
);

-- Allow inserting user roles during registration
CREATE POLICY "user_roles_insert_system" ON public.user_roles
FOR INSERT WITH CHECK (true);

-- 4. Event categories - public read access
CREATE POLICY "event_categories_public_read" ON public.event_categories
FOR SELECT USING (true);

-- 5. Events - public read for active events
CREATE POLICY "events_public_read" ON public.events
FOR SELECT USING (is_active = true);

-- Allow creating events for authenticated users
CREATE POLICY "events_create_authenticated" ON public.events
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow updating own events
CREATE POLICY "events_update_own" ON public.events
FOR UPDATE USING (
  created_by_volunteer_id IN (
    SELECT id FROM public.volunteers WHERE auth_user_id = auth.uid()
  )
);

-- 6. Event participation - users can manage their own participation
CREATE POLICY "event_participation_own_records" ON public.event_participation
FOR ALL USING (
  volunteer_id IN (
    SELECT id FROM public.volunteers WHERE auth_user_id = auth.uid()
  )
);

-- =====================================================================================================
-- PERMISSIONS
-- =====================================================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_volunteer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_events_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_activity_trends() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_events_by_impact(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_volunteers_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_volunteer_hours_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_participants(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_volunteer_participation_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_event_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_event_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_event_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_register_for_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_for_event TO authenticated;

-- =====================================================================================================
-- FUNCTION DOCUMENTATION
-- =====================================================================================================

COMMENT ON FUNCTION public.mark_event_attendance IS 'Marks attendance for multiple volunteers';
COMMENT ON FUNCTION public.sync_event_attendance IS 'Removes unmarked attendees';
COMMENT ON FUNCTION public.update_event_attendance IS 'Combined function to update event attendance';

-- =====================================================================================================
-- COMPLETION NOTICE
-- =====================================================================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================================================================';
    RAISE NOTICE 'NSS Dashboard Database Schema v8 - Complete Production Database';
    RAISE NOTICE '=====================================================================================================';
    RAISE NOTICE 'Tables Created: 6 (event_categories, role_definitions, volunteers, user_roles, events, event_participation)';
    RAISE NOTICE 'Functions Created: 20 (Core + Dashboard + Volunteers + Attendance + Utility)';
    RAISE NOTICE 'Views Created: 3 (event_summary, role_management, volunteer_summary)';
    RAISE NOTICE 'RLS Policies: 9 clean, non-recursive policies';
    RAISE NOTICE 'Initial Data: 4 roles, 10 event categories';
    RAISE NOTICE 'Indexes: 24+ performance-optimized indexes';
    RAISE NOTICE 'Triggers: 9 data consistency triggers';
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
    RAISE NOTICE '';
    RAISE NOTICE 'Volunteer Functions:';
    RAISE NOTICE '  - get_volunteers_with_stats()';
    RAISE NOTICE '  - get_user_stats() [NEW in v8]';
    RAISE NOTICE '  - get_volunteer_hours_summary() [NEW in v8]';
    RAISE NOTICE '';
    RAISE NOTICE 'Attendance Functions:';
    RAISE NOTICE '  - get_attendance_summary()';
    RAISE NOTICE '  - get_event_participants()';
    RAISE NOTICE '  - get_volunteer_participation_history()';
    RAISE NOTICE '  - mark_event_attendance()';
    RAISE NOTICE '  - sync_event_attendance()';
    RAISE NOTICE '  - update_event_attendance()';
    RAISE NOTICE '';
    RAISE NOTICE 'Utility Functions:';
    RAISE NOTICE '  - has_role()';
    RAISE NOTICE '  - has_any_role()';
    RAISE NOTICE '  - can_register_for_event()';
    RAISE NOTICE '  - create_event()';
    RAISE NOTICE '  - register_for_event()';
    RAISE NOTICE '';
    RAISE NOTICE 'Your NSS Dashboard v8.0.0 is ready for production!';
    RAISE NOTICE '=====================================================================================================';
END $$;
