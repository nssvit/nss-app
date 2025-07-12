-- ======================================================================
-- NSS DASHBOARD DATABASE SCHEMA v5 - ROBUST & MAINTAINABLE
-- Fixes Critical Architectural Issues from v4
-- ======================================================================

-- ======================================================================
-- COMPREHENSIVE CLEANUP - Remove ALL previous schema versions
-- ======================================================================
DO $$
DECLARE
    r RECORD;
    func_record RECORD;
    view_record RECORD;
BEGIN
    -- Drop all RLS policies
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;

    -- Drop all views
    FOR view_record IN (
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        AND viewname LIKE ANY(ARRAY['volunteer_%', 'event_%', 'lead_%', 'participation_%'])
    )
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_record.viewname);
    END LOOP;

    -- Drop all tables (order matters!)
    DROP TABLE IF EXISTS public.event_participation CASCADE;
    DROP TABLE IF EXISTS public.user_roles CASCADE;
    DROP TABLE IF EXISTS public.events CASCADE;
    DROP TABLE IF EXISTS public.volunteers CASCADE;
    DROP TABLE IF EXISTS public.leads CASCADE;
    DROP TABLE IF EXISTS public.roles CASCADE;
    DROP TABLE IF EXISTS public.role_definitions CASCADE;
    DROP TABLE IF EXISTS public.event_categories CASCADE;
    DROP TABLE IF EXISTS public.audit_logs CASCADE;
    DROP TABLE IF EXISTS public.attendance_statuses CASCADE;
    DROP TABLE IF EXISTS public.academic_sessions CASCADE;
    DROP TABLE IF EXISTS public.gender_types CASCADE;

    -- Drop all functions
    FOR func_record IN (
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND proname LIKE ANY(ARRAY['has_%', 'get_%', 'trigger_%', 'validate_%', 'check_%', 'audit_%', 'search_%'])
    )
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;

    RAISE NOTICE 'Complete cleanup finished - ready for v5 schema';
END $$;

-- ======================================================================
-- 1. EXTENSIONS
-- ======================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ======================================================================
-- 2. CORE TABLES - FIXED ARCHITECTURE
-- ======================================================================

-- Volunteers table (Universal set - everyone is a volunteer first)
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL CHECK (LENGTH(TRIM(first_name)) > 0),
    last_name TEXT NOT NULL CHECK (LENGTH(TRIM(last_name)) > 0),
    roll_number TEXT UNIQUE NOT NULL CHECK (LENGTH(TRIM(roll_number)) > 0),
    email CITEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    branch TEXT NOT NULL CHECK (branch IN ('EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC')),
    year TEXT NOT NULL CHECK (year IN ('FE', 'SE', 'TE')),
    phone_no TEXT CHECK (phone_no IS NULL OR LENGTH(TRIM(phone_no)) >= 10),
    birth_date DATE CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE),
    gender TEXT CHECK (gender IN ('M', 'F', 'Prefer not to say')),
    nss_join_year INT CHECK (nss_join_year >= 2020 AND nss_join_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    address TEXT,
    profile_pic TEXT, -- URL to Supabase storage
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- FIXED: Role Definitions table - Centralized role management with permissions
CREATE TABLE public.role_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(role_name)) > 0),
    display_name TEXT NOT NULL CHECK (LENGTH(TRIM(display_name)) > 0),
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    hierarchy_level INT NOT NULL DEFAULT 0, -- Lower number = higher authority
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- FIXED: User Roles table - Clean separation of role assignments from definitions
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    role_definition_id UUID NOT NULL REFERENCES public.role_definitions(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ, -- Optional role expiration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (volunteer_id, role_definition_id)
);

-- Event categories table
CREATE TABLE public.event_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) > 0),
    code TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(code)) > 0),
    description TEXT,
    color_hex TEXT CHECK (color_hex IS NULL OR color_hex ~* '^#[0-9A-F]{6}$'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- FIXED: Events table - Supports multi-day events, capacity management, and status workflow
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT,
    -- FIXED: Support for multi-day events
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    declared_hours INT NOT NULL CHECK (declared_hours BETWEEN 1 AND 240), -- Support multi-day events
    category_id INT NOT NULL REFERENCES public.event_categories(id),
    -- FIXED: Capacity management
    min_participants INT CHECK (min_participants IS NULL OR min_participants > 0),
    max_participants INT CHECK (max_participants IS NULL OR max_participants > 0),
    -- FIXED: Event status workflow
    event_status TEXT NOT NULL DEFAULT 'planned' CHECK (
        event_status IN ('planned', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled')
    ),
    location TEXT,
    registration_deadline TIMESTAMPTZ,
    created_by_volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Ensure end_date is not before start_date
    CHECK (end_date >= start_date),
    -- Ensure max_participants is greater than min_participants
    CHECK (min_participants IS NULL OR max_participants IS NULL OR min_participants <= max_participants)
);

-- Event participation table with enhanced tracking
CREATE TABLE public.event_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    hours_attended INT NOT NULL CHECK (hours_attended >= 0),
    participation_status TEXT NOT NULL DEFAULT 'registered' CHECK (
        participation_status IN ('registered', 'present', 'absent', 'partially_present', 'excused')
    ),
    registration_date TIMESTAMPTZ DEFAULT now(),
    attendance_date TIMESTAMPTZ,
    notes TEXT,
    feedback TEXT,
    recorded_by_volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (event_id, volunteer_id)
);

-- ======================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ======================================================================

-- Volunteers table indexes
CREATE INDEX idx_volunteers_auth_user ON public.volunteers(auth_user_id);
CREATE INDEX idx_volunteers_active ON public.volunteers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_volunteers_branch ON public.volunteers(branch);
CREATE INDEX idx_volunteers_year ON public.volunteers(year);
CREATE INDEX idx_volunteers_roll_number ON public.volunteers(roll_number);
CREATE INDEX idx_volunteers_email ON public.volunteers(email);

-- Role definitions indexes
CREATE INDEX idx_role_definitions_name ON public.role_definitions(role_name);
CREATE INDEX idx_role_definitions_active ON public.role_definitions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_role_definitions_hierarchy ON public.role_definitions(hierarchy_level);

-- User roles indexes
CREATE INDEX idx_user_roles_volunteer ON public.user_roles(volunteer_id);
CREATE INDEX idx_user_roles_role_def ON public.user_roles(role_definition_id);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_roles_expires ON public.user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Events table indexes
CREATE INDEX idx_events_start_date ON public.events(start_date DESC);
CREATE INDEX idx_events_end_date ON public.events(end_date DESC);
CREATE INDEX idx_events_status ON public.events(event_status);
CREATE INDEX idx_events_category ON public.events(category_id);
CREATE INDEX idx_events_created_by ON public.events(created_by_volunteer_id);
CREATE INDEX idx_events_active ON public.events(is_active) WHERE is_active = TRUE;

-- Event participation indexes
CREATE INDEX idx_participation_event ON public.event_participation(event_id);
CREATE INDEX idx_participation_volunteer ON public.event_participation(volunteer_id);
CREATE INDEX idx_participation_status ON public.event_participation(participation_status);
CREATE INDEX idx_participation_registration ON public.event_participation(registration_date);

-- ======================================================================
-- 4. UTILITY FUNCTIONS - ROBUST IMPLEMENTATION
-- ======================================================================

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FIXED: Robust role checking function using role definitions
CREATE OR REPLACE FUNCTION public.has_role(p_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

-- FIXED: Enhanced role checking with multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(VARIADIC p_role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

-- Get current volunteer with all roles
CREATE OR REPLACE FUNCTION public.get_current_volunteer()
RETURNS TABLE (
    volunteer_id UUID,
    first_name TEXT,
    last_name TEXT,
    email CITEXT,
    roll_number TEXT,
    roles TEXT[],
    permissions JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        v.id,
        v.first_name,
        v.last_name,
        v.email,
        v.roll_number,
        COALESCE(ARRAY_AGG(rd.role_name ORDER BY rd.hierarchy_level) FILTER (WHERE rd.role_name IS NOT NULL), ARRAY[]::TEXT[]) as roles,
        COALESCE(jsonb_agg(rd.permissions ORDER BY rd.hierarchy_level) -> 0, '{}'::jsonb) as permissions
    FROM public.volunteers v
    LEFT JOIN public.user_roles ur ON v.id = ur.volunteer_id 
        AND ur.is_active = TRUE 
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
    LEFT JOIN public.role_definitions rd ON ur.role_definition_id = rd.id AND rd.is_active = TRUE
    WHERE v.auth_user_id = auth.uid()
    AND v.is_active = TRUE
    GROUP BY v.id, v.first_name, v.last_name, v.email, v.roll_number;
$$;

-- Event capacity checking function
CREATE OR REPLACE FUNCTION public.can_register_for_event(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
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

-- ======================================================================
-- 5. TRIGGERS
-- ======================================================================

-- Updated_at triggers
CREATE TRIGGER set_volunteers_updated_at
    BEFORE UPDATE ON public.volunteers
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_role_definitions_updated_at
    BEFORE UPDATE ON public.role_definitions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_event_categories_updated_at
    BEFORE UPDATE ON public.event_categories
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_participation_updated_at
    BEFORE UPDATE ON public.event_participation
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ======================================================================
-- 6. ROW LEVEL SECURITY - MAINTAINABLE POLICIES
-- ======================================================================

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 7. RLS POLICIES - SCALABLE DESIGN
-- ======================================================================

-- Volunteers policies
CREATE POLICY "volunteers_self_management"
    ON public.volunteers FOR ALL
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "volunteers_admin_full_access"
    ON public.volunteers FOR ALL
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

CREATE POLICY "volunteers_staff_read_access"
    ON public.volunteers FOR SELECT
    USING (public.has_any_role('admin', 'program_officer', 'heads'));

-- Role definitions policies (only admins can manage role definitions)
CREATE POLICY "role_definitions_admin_only"
    ON public.role_definitions FOR ALL
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

CREATE POLICY "role_definitions_read_access"
    ON public.role_definitions FOR SELECT
    USING (TRUE); -- All authenticated users can read role definitions

-- User roles policies
CREATE POLICY "user_roles_admin_management"
    ON public.user_roles FOR ALL
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

CREATE POLICY "user_roles_self_read"
    ON public.user_roles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.volunteers v 
        WHERE v.id = volunteer_id AND v.auth_user_id = auth.uid()
    ));

-- Events policies
CREATE POLICY "events_creation"
    ON public.events FOR INSERT
    WITH CHECK (public.has_any_role('admin', 'heads'));

CREATE POLICY "events_management"
    ON public.events FOR UPDATE
    USING (
        public.has_role('admin') OR 
        (public.has_any_role('heads') AND created_by_volunteer_id IN (
            SELECT v.id FROM public.volunteers v WHERE v.auth_user_id = auth.uid()
        ))
    )
    WITH CHECK (
        public.has_role('admin') OR 
        (public.has_any_role('heads') AND created_by_volunteer_id IN (
            SELECT v.id FROM public.volunteers v WHERE v.auth_user_id = auth.uid()
        ))
    );

CREATE POLICY "events_read_access"
    ON public.events FOR SELECT
    USING (TRUE); -- All authenticated users can read events

-- Event participation policies
CREATE POLICY "participation_staff_management"
    ON public.event_participation FOR ALL
    USING (public.has_any_role('admin', 'heads'))
    WITH CHECK (public.has_any_role('admin', 'heads'));

CREATE POLICY "participation_self_register"
    ON public.event_participation FOR INSERT
    WITH CHECK (
        volunteer_id IN (
            SELECT v.id FROM public.volunteers v WHERE v.auth_user_id = auth.uid()
        )
        AND public.can_register_for_event(event_id)
    );

CREATE POLICY "participation_read_access"
    ON public.event_participation FOR SELECT
    USING (
        public.has_any_role('admin', 'heads', 'program_officer') OR
        volunteer_id IN (
            SELECT v.id FROM public.volunteers v WHERE v.auth_user_id = auth.uid()
        )
    );

-- ======================================================================
-- 8. ENHANCED VIEWS - COMPREHENSIVE DATA ACCESS
-- ======================================================================

-- Volunteer summary with enhanced role information
CREATE OR REPLACE VIEW public.volunteer_summary AS
SELECT 
    v.id,
    v.first_name,
    v.last_name,
    v.first_name || ' ' || v.last_name as full_name,
    v.roll_number,
    v.email,
    v.branch,
    v.year,
    v.phone_no,
    v.nss_join_year,
    v.is_active,
    -- Enhanced role information
    COALESCE(ARRAY_AGG(rd.role_name ORDER BY rd.hierarchy_level) FILTER (WHERE rd.role_name IS NOT NULL), ARRAY[]::TEXT[]) as roles,
    COALESCE(ARRAY_AGG(rd.display_name ORDER BY rd.hierarchy_level) FILTER (WHERE rd.display_name IS NOT NULL), ARRAY[]::TEXT[]) as role_display_names,
    MIN(rd.hierarchy_level) as highest_role_level,
    -- Participation statistics
    COUNT(DISTINCT ep.id) as total_events_participated,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours_completed,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'present' THEN ep.id END) as events_attended,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'absent' THEN ep.id END) as events_missed,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'registered' THEN ep.id END) as events_registered,
    MAX(e.end_date) as last_event_date,
    v.created_at,
    v.updated_at
FROM public.volunteers v
LEFT JOIN public.user_roles ur ON v.id = ur.volunteer_id 
    AND ur.is_active = TRUE 
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
LEFT JOIN public.role_definitions rd ON ur.role_definition_id = rd.id AND rd.is_active = TRUE
LEFT JOIN public.event_participation ep ON v.id = ep.volunteer_id
LEFT JOIN public.events e ON ep.event_id = e.id AND e.is_active = TRUE
GROUP BY v.id, v.first_name, v.last_name, v.roll_number, v.email, 
         v.branch, v.year, v.phone_no, v.nss_join_year, v.is_active, 
         v.created_at, v.updated_at;

-- Enhanced event summary with capacity tracking
CREATE OR REPLACE VIEW public.event_summary AS
SELECT 
    e.id,
    e.name,
    e.description,
    e.start_date,
    e.end_date,
    (e.end_date - e.start_date + 1) as duration_days,
    e.declared_hours,
    ec.name as category,
    ec.color_hex as category_color,
    e.min_participants,
    e.max_participants,
    e.event_status,
    e.location,
    e.registration_deadline,
    -- Participation statistics
    COUNT(DISTINCT ep.id) as total_participants,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'registered' THEN ep.id END) as registered_count,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'present' THEN ep.id END) as present_count,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'absent' THEN ep.id END) as absent_count,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'partially_present' THEN ep.id END) as partial_count,
    -- Capacity management
    CASE 
        WHEN e.max_participants IS NOT NULL THEN 
            ROUND((COUNT(DISTINCT CASE WHEN ep.participation_status IN ('registered', 'present', 'partially_present') THEN ep.id END) * 100.0) / e.max_participants, 2)
        ELSE NULL 
    END as capacity_percentage,
    CASE 
        WHEN e.max_participants IS NOT NULL THEN 
            e.max_participants - COUNT(DISTINCT CASE WHEN ep.participation_status IN ('registered', 'present', 'partially_present') THEN ep.id END)
        ELSE NULL 
    END as available_slots,
    -- Statistics
    COALESCE(AVG(ep.hours_attended), 0) as avg_hours_attended,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours_logged,
    cv.first_name || ' ' || cv.last_name as created_by,
    e.created_at,
    e.updated_at
FROM public.events e
LEFT JOIN public.event_categories ec ON e.category_id = ec.id
LEFT JOIN public.event_participation ep ON e.id = ep.event_id
LEFT JOIN public.volunteers cv ON e.created_by_volunteer_id = cv.id
WHERE e.is_active = TRUE
GROUP BY e.id, e.name, e.description, e.start_date, e.end_date, e.declared_hours, 
         ec.name, ec.color_hex, e.min_participants, e.max_participants, e.event_status,
         e.location, e.registration_deadline, cv.first_name, cv.last_name, 
         e.created_at, e.updated_at;

-- Role management view for administrators
CREATE OR REPLACE VIEW public.role_management AS
SELECT 
    v.id as volunteer_id,
    v.first_name || ' ' || v.last_name as volunteer_name,
    v.roll_number,
    v.email,
    v.branch,
    v.year,
    ur.id as assignment_id,
    rd.role_name,
    rd.display_name as role_display_name,
    rd.hierarchy_level,
    ur.assigned_at,
    ur.expires_at,
    ur.is_active as assignment_active,
    av.first_name || ' ' || av.last_name as assigned_by_name
FROM public.volunteers v
LEFT JOIN public.user_roles ur ON v.id = ur.volunteer_id
LEFT JOIN public.role_definitions rd ON ur.role_definition_id = rd.id
LEFT JOIN public.volunteers av ON ur.assigned_by = av.id
WHERE v.is_active = TRUE
ORDER BY v.roll_number, rd.hierarchy_level NULLS LAST;

-- ======================================================================
-- 9. SEED DATA - PROPER ROLE DEFINITIONS
-- ======================================================================

-- Insert role definitions with proper permissions
INSERT INTO public.role_definitions (role_name, display_name, description, permissions, hierarchy_level) VALUES
    ('admin', 'Administrator', 'Full system administration access', 
     '{"create": ["*"], "read": ["*"], "update": ["*"], "delete": ["*"], "manage_roles": true}', 0),
    ('program_officer', 'Program Officer', 'View all data for oversight and reporting', 
     '{"create": [], "read": ["*"], "update": [], "delete": [], "manage_roles": false}', 10),
    ('heads', 'NSS Head', 'Event creation and participation management', 
     '{"create": ["events", "participation"], "read": ["volunteers", "events", "participation"], "update": ["events", "participation"], "delete": ["events"], "manage_roles": false}', 20);

-- Insert default event categories
INSERT INTO public.event_categories (code, name, description, color_hex) VALUES
    ('AB1', 'Area Based - 1', 'Community service in adopted areas - Phase 1', '#4CAF50'),
    ('AB2', 'Area Based - 2', 'Community service in adopted areas - Phase 2', '#8BC34A'),
    ('UE', 'University Events', 'University-wide NSS activities', '#2196F3'),
    ('CE', 'College Events', 'College-specific NSS programs', '#03A9F4');

-- ======================================================================
-- 10. GRANTS AND PERMISSIONS
-- ======================================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to views
GRANT SELECT ON public.volunteer_summary TO authenticated;
GRANT SELECT ON public.event_summary TO authenticated;
GRANT SELECT ON public.role_management TO authenticated;

-- ======================================================================
-- SCHEMA COMPLETE - ROBUST & MAINTAINABLE v5
-- ======================================================================

-- Add comprehensive comments
COMMENT ON SCHEMA public IS 'NSS Dashboard Database Schema v5 - Robust & Maintainable';
COMMENT ON TABLE public.volunteers IS 'Universal volunteer table - everyone is a volunteer first';
COMMENT ON TABLE public.role_definitions IS 'Centralized role definitions with permissions - SCALABLE';
COMMENT ON TABLE public.user_roles IS 'Role assignments to volunteers - clean separation of concerns';
COMMENT ON TABLE public.events IS 'Enhanced events with multi-day support, capacity management, and status workflow';
COMMENT ON TABLE public.event_participation IS 'Comprehensive participation tracking with registration workflow';
COMMENT ON FUNCTION public.has_role(TEXT) IS 'Robust role checking using centralized role definitions';
COMMENT ON FUNCTION public.has_any_role(VARIADIC TEXT[]) IS 'Scalable multi-role checking function';
COMMENT ON FUNCTION public.can_register_for_event(UUID) IS 'Event capacity and registration validation';
COMMENT ON VIEW public.volunteer_summary IS 'Complete volunteer information with enhanced role details';
COMMENT ON VIEW public.event_summary IS 'Comprehensive event analytics with capacity tracking'; 