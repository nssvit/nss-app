-- ======================================================================
-- NSS DASHBOARD DATABASE SCHEMA v4 - MINIMAL & ROBUST
-- Simplified Schema Based on Core Requirements
-- ======================================================================

-- ======================================================================
-- COMPREHENSIVE CLEANUP - Remove ALL previous schema versions (v1, v2, v3)
-- ======================================================================
DO $$
DECLARE
    r RECORD;
    func_record RECORD;
    view_record RECORD;
BEGIN
    -- ===================================================================
    -- 1. DROP ALL RLS POLICIES FROM ALL PREVIOUS VERSIONS
    -- ===================================================================
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;

    -- ===================================================================
    -- 2. DROP ALL VIEWS FROM ALL PREVIOUS VERSIONS
    -- ===================================================================
    FOR view_record IN (
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        AND viewname IN (
            'volunteer_summary', 'event_summary', 'lead_profiles', 'participation_details',
            'volunteer_roles', 'volunteer_hours_summary'
        )
    )
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_record.viewname);
    END LOOP;

    -- ===================================================================
    -- 3. DROP ALL TABLES FROM ALL PREVIOUS VERSIONS (Order matters!)
    -- ===================================================================
    -- Junction and dependent tables first
    DROP TABLE IF EXISTS public.audit_logs CASCADE;
    DROP TABLE IF EXISTS public.event_participation CASCADE;
    DROP TABLE IF EXISTS public.user_roles CASCADE;
    
    -- Main tables
    DROP TABLE IF EXISTS public.events CASCADE;
    DROP TABLE IF EXISTS public.volunteers CASCADE;
    DROP TABLE IF EXISTS public.leads CASCADE;
    DROP TABLE IF EXISTS public.roles CASCADE;
    
    -- Lookup tables from v2/v3
    DROP TABLE IF EXISTS public.attendance_statuses CASCADE;
    DROP TABLE IF EXISTS public.event_categories CASCADE;
    DROP TABLE IF EXISTS public.academic_sessions CASCADE;
    DROP TABLE IF EXISTS public.gender_types CASCADE;

    -- ===================================================================
    -- 4. DROP ALL FUNCTIONS FROM ALL PREVIOUS VERSIONS
    -- ===================================================================
    FOR func_record IN (
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND proname IN (
            'has_role', 'get_current_lead', 'get_current_volunteer', 'trigger_set_updated_at',
            'validate_academic_year', 'validate_event_hours', 'calculate_age',
            'check_participation_hours_constraint', 'audit_trigger',
            'calculate_volunteer_stats', 'search_volunteers', 'search_events',
            'get_user_roles'
        )
    )
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;

    -- Additional function cleanup with different signatures
    DROP FUNCTION IF EXISTS public.has_role(VARIADIC TEXT[]) CASCADE;
    DROP FUNCTION IF EXISTS public.has_role(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.get_current_lead() CASCADE;
    DROP FUNCTION IF EXISTS public.get_current_volunteer() CASCADE;
    DROP FUNCTION IF EXISTS public.trigger_set_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS public.validate_event_hours(UUID, INT) CASCADE;
    DROP FUNCTION IF EXISTS public.check_participation_hours_constraint() CASCADE;
    DROP FUNCTION IF EXISTS public.audit_trigger() CASCADE;
    DROP FUNCTION IF EXISTS public.search_volunteers(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.search_events(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.validate_academic_year(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.calculate_age(DATE) CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_roles(UUID) CASCADE;

    -- ===================================================================
    -- 5. DROP ALL TRIGGERS FROM PREVIOUS VERSIONS
    -- ===================================================================
    -- We don't need to explicitly drop triggers as they're dropped with tables
    -- But for safety, let's drop any remaining ones
    
    -- ===================================================================
    -- 6. CLEANUP COMPLETE
    -- ===================================================================
    RAISE NOTICE 'Comprehensive cleanup completed - all previous schema versions removed';
END $$;

-- ======================================================================
-- 1. EXTENSIONS
-- ======================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ======================================================================
-- 2. CORE TABLES
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

-- Roles table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'program_officer', 'heads')),
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (volunteer_id, role)
);

-- Event categories table
CREATE TABLE public.event_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT,
    event_date DATE NOT NULL,
    declared_hours INT NOT NULL CHECK (declared_hours BETWEEN 1 AND 24),
    category_id INT NOT NULL REFERENCES public.event_categories(id),
    min_participants INT CHECK (min_participants IS NULL OR min_participants > 0),
    created_by_volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Event participation table
CREATE TABLE public.event_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    hours_attended INT NOT NULL CHECK (hours_attended >= 0),
    participation_status TEXT NOT NULL DEFAULT 'present' CHECK (
        participation_status IN ('present', 'absent', 'partially present')
    ),
    notes TEXT,
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

-- Roles table indexes
CREATE INDEX idx_roles_volunteer ON public.roles(volunteer_id);
CREATE INDEX idx_roles_role ON public.roles(role);
CREATE INDEX idx_roles_active ON public.roles(is_active) WHERE is_active = TRUE;

-- Events table indexes
CREATE INDEX idx_events_date ON public.events(event_date DESC);
CREATE INDEX idx_events_category ON public.events(category_id);
CREATE INDEX idx_events_created_by ON public.events(created_by_volunteer_id);
CREATE INDEX idx_events_active ON public.events(is_active) WHERE is_active = TRUE;

-- Event participation indexes
CREATE INDEX idx_participation_event ON public.event_participation(event_id);
CREATE INDEX idx_participation_volunteer ON public.event_participation(volunteer_id);
CREATE INDEX idx_participation_status ON public.event_participation(participation_status);

-- ======================================================================
-- 4. UTILITY FUNCTIONS
-- ======================================================================

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Role checking function
CREATE OR REPLACE FUNCTION public.has_role(p_role TEXT)
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
        FROM public.roles r
        JOIN public.volunteers v ON r.volunteer_id = v.id
        WHERE v.auth_user_id = current_user_id 
        AND r.role = p_role
        AND r.is_active = TRUE
        AND v.is_active = TRUE
    ) INTO user_has_role;
    
    RETURN user_has_role;
END;
$$;

-- Get current volunteer information
CREATE OR REPLACE FUNCTION public.get_current_volunteer()
RETURNS TABLE (
    volunteer_id UUID,
    first_name TEXT,
    last_name TEXT,
    email CITEXT,
    roll_number TEXT,
    roles TEXT[]
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
        COALESCE(ARRAY_AGG(r.role ORDER BY r.role) FILTER (WHERE r.role IS NOT NULL), ARRAY[]::TEXT[]) as roles
    FROM public.volunteers v
    LEFT JOIN public.roles r ON v.id = r.volunteer_id AND r.is_active = TRUE
    WHERE v.auth_user_id = auth.uid()
    AND v.is_active = TRUE
    GROUP BY v.id, v.first_name, v.last_name, v.email, v.roll_number;
$$;

-- ======================================================================
-- 5. TRIGGERS
-- ======================================================================

-- Updated_at triggers
CREATE TRIGGER set_volunteers_updated_at
    BEFORE UPDATE ON public.volunteers
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_roles_updated_at
    BEFORE UPDATE ON public.roles
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
-- 6. ROW LEVEL SECURITY
-- ======================================================================

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 7. RLS POLICIES
-- ======================================================================

-- Volunteers policies
CREATE POLICY "volunteers_self_management"
    ON public.volunteers FOR ALL
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "volunteers_admin_management"
    ON public.volunteers FOR ALL
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

CREATE POLICY "volunteers_heads_read"
    ON public.volunteers FOR SELECT
    USING (public.has_role('heads') OR public.has_role('program_officer'));

-- Roles policies
CREATE POLICY "roles_admin_only"
    ON public.roles FOR ALL
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

CREATE POLICY "roles_self_read"
    ON public.roles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.volunteers v 
        WHERE v.id = volunteer_id AND v.auth_user_id = auth.uid()
    ));

-- Events policies
CREATE POLICY "events_creation_management"
    ON public.events FOR INSERT
    WITH CHECK (public.has_role('admin') OR public.has_role('heads'));

CREATE POLICY "events_update_management"
    ON public.events FOR UPDATE
    USING (
        public.has_role('admin') OR 
        (public.has_role('heads') AND created_by_volunteer_id IN (
            SELECT v.id FROM public.volunteers v WHERE v.auth_user_id = auth.uid()
        ))
    )
    WITH CHECK (
        public.has_role('admin') OR 
        (public.has_role('heads') AND created_by_volunteer_id IN (
            SELECT v.id FROM public.volunteers v WHERE v.auth_user_id = auth.uid()
        ))
    );

CREATE POLICY "events_read_access"
    ON public.events FOR SELECT
    USING (TRUE); -- All authenticated users can read events

-- Event participation policies
CREATE POLICY "participation_management"
    ON public.event_participation FOR ALL
    USING (public.has_role('admin') OR public.has_role('heads'))
    WITH CHECK (public.has_role('admin') OR public.has_role('heads'));

CREATE POLICY "participation_read_access"
    ON public.event_participation FOR SELECT
    USING (
        public.has_role('admin') OR 
        public.has_role('heads') OR 
        public.has_role('program_officer') OR
        volunteer_id IN (
            SELECT v.id FROM public.volunteers v WHERE v.auth_user_id = auth.uid()
        )
    );

-- ======================================================================
-- 8. HELPFUL VIEWS
-- ======================================================================

-- Volunteer summary with role information
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
    COALESCE(ARRAY_AGG(r.role ORDER BY r.role) FILTER (WHERE r.role IS NOT NULL), ARRAY[]::TEXT[]) as roles,
    COUNT(DISTINCT ep.id) as total_events_participated,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours_completed,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'present' THEN ep.id END) as events_attended,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'absent' THEN ep.id END) as events_missed,
    MAX(e.event_date) as last_event_date,
    v.created_at,
    v.updated_at
FROM public.volunteers v
LEFT JOIN public.roles r ON v.id = r.volunteer_id AND r.is_active = TRUE
LEFT JOIN public.event_participation ep ON v.id = ep.volunteer_id
LEFT JOIN public.events e ON ep.event_id = e.id AND e.is_active = TRUE
GROUP BY v.id, v.first_name, v.last_name, v.roll_number, v.email, 
         v.branch, v.year, v.phone_no, v.nss_join_year, v.is_active, 
         v.created_at, v.updated_at;

-- Event summary with participation statistics
CREATE OR REPLACE VIEW public.event_summary AS
SELECT 
    e.id,
    e.name,
    e.description,
    e.event_date,
    e.declared_hours,
    ec.name as category,
    e.min_participants,
    COUNT(DISTINCT ep.id) as total_participants,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'present' THEN ep.id END) as present_count,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'absent' THEN ep.id END) as absent_count,
    COUNT(DISTINCT CASE WHEN ep.participation_status = 'partially present' THEN ep.id END) as partial_count,
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
GROUP BY e.id, e.name, e.description, e.event_date, e.declared_hours, 
         ec.name, e.min_participants, cv.first_name, cv.last_name, 
         e.created_at, e.updated_at;

-- Volunteer roles view for easy role management
CREATE OR REPLACE VIEW public.volunteer_roles AS
SELECT 
    v.id as volunteer_id,
    v.first_name || ' ' || v.last_name as volunteer_name,
    v.roll_number,
    v.email,
    v.branch,
    v.year,
    r.id as role_id,
    r.role,
    r.description as role_description,
    r.is_active as role_active,
    r.created_at as role_assigned_at
FROM public.volunteers v
LEFT JOIN public.roles r ON v.id = r.volunteer_id
WHERE v.is_active = TRUE
ORDER BY v.roll_number, r.role;

-- ======================================================================
-- 9. SEED DATA
-- ======================================================================

-- Insert default event categories
INSERT INTO public.event_categories (name, description) VALUES
    ('AB1', 'Area Based Activity - 1'),
    ('AB2', 'Area Based Activity - 2'),
    ('University Events', 'University-wide NSS activities'),
    ('College Events', 'College-specific NSS programs');

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
GRANT SELECT ON public.volunteer_roles TO authenticated;

-- ======================================================================
-- SCHEMA COMPLETE - MINIMAL & ROBUST v4
-- ======================================================================

-- Add helpful comments
COMMENT ON SCHEMA public IS 'NSS Dashboard Database Schema v4 - Minimal & Robust';
COMMENT ON TABLE public.volunteers IS 'All users are volunteers first - universal set for NSS dashboard';
COMMENT ON TABLE public.roles IS 'Role assignments for volunteers (admin, program_officer, heads)';
COMMENT ON TABLE public.events IS 'NSS events with basic information and requirements';
COMMENT ON TABLE public.event_participation IS 'Volunteer participation in events with flexible hours';
COMMENT ON FUNCTION public.has_role(TEXT) IS 'Simple role checking function for access control';
COMMENT ON VIEW public.volunteer_summary IS 'Comprehensive volunteer information with participation stats';
COMMENT ON VIEW public.event_summary IS 'Event details with participation statistics'; 