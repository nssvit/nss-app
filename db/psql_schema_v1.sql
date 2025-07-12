-- ======================================================================
-- IMPROVED NSS DASHBOARD DATABASE SCHEMA - SUPABASE OPTIMIZED
-- ======================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop policies from tables first
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('event_participation', 'user_roles', 'events', 'roles', 'volunteers', 'leads'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public."' || r.tablename || '";';
    END LOOP;

    -- Drop views
    DROP VIEW IF EXISTS public.volunteer_hours_summary CASCADE;
    DROP VIEW IF EXISTS public.event_summary CASCADE;

    -- Drop tables with CASCADE
    DROP TABLE IF EXISTS public.event_participation CASCADE;
    DROP TABLE IF EXISTS public.user_roles CASCADE;
    DROP TABLE IF EXISTS public.events CASCADE;
    DROP TABLE IF EXISTS public.roles CASCADE;
    DROP TABLE IF EXISTS public.volunteers CASCADE;
    DROP TABLE IF EXISTS public.leads CASCADE;

    -- Drop functions
    DROP FUNCTION IF EXISTS public.has_role(VARIADIC TEXT[]) CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_roles(p_user_id UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.trigger_set_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS public.validate_academic_year(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.validate_event_hours(UUID, INT) CASCADE;
    DROP FUNCTION IF EXISTS public.calculate_age(DATE) CASCADE;
END $$;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================================================================
-- 1. CREATE VALIDATION FUNCTIONS FIRST
-- ======================================================================

-- Validate academic year format (YYYY-YYYY)
CREATE OR REPLACE FUNCTION public.validate_academic_year(year_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    start_year INT;
    end_year INT;
BEGIN
    IF year_text IS NULL OR year_text !~ '^\d{4}-\d{4}$' THEN
        RETURN FALSE;
    END IF;
    
    start_year := CAST(SPLIT_PART(year_text, '-', 1) AS INT);
    end_year := CAST(SPLIT_PART(year_text, '-', 2) AS INT);
    
    -- End year should be exactly start year + 1
    -- Also validate reasonable year range (2020-2050)
    RETURN end_year = start_year + 1 
        AND start_year >= 2020 
        AND start_year <= 2050;
END;
$$;

-- Calculate age from birth date
CREATE OR REPLACE FUNCTION public.calculate_age(birth_date DATE)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INT;
$$;

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================
-- 2. CREATE TABLES
-- ======================================================================

-- `roles` table: Defines distinct roles for system users
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT CHECK (description IS NULL OR LENGTH(TRIM(description)) > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_roles_active ON public.roles(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE public.roles IS 'System roles defining permission levels';

-- `leads` table: Dashboard users (leads/administrators)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL CHECK (LENGTH(TRIM(first_name)) > 0),
    last_name TEXT NOT NULL CHECK (LENGTH(TRIM(last_name)) > 0),
    email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone_number TEXT CHECK (phone_number IS NULL OR LENGTH(TRIM(phone_number)) >= 10),
    designation TEXT CHECK (designation IS NULL OR LENGTH(TRIM(designation)) > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_leads_auth_user ON public.leads(auth_user_id);
CREATE INDEX idx_leads_active ON public.leads(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE public.leads IS 'Dashboard users (leads/administrators) linked to auth.users';

-- `volunteers` table: Individual volunteer details
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL CHECK (LENGTH(TRIM(first_name)) > 0),
    last_name TEXT NOT NULL CHECK (LENGTH(TRIM(last_name)) > 0),
    birth_date DATE CHECK (birth_date IS NULL OR (birth_date <= CURRENT_DATE AND birth_date >= '1990-01-01')),
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    enrollment_academic_year TEXT NOT NULL CHECK (public.validate_academic_year(enrollment_academic_year)),
    current_nss_year INT NOT NULL CHECK (current_nss_year IN (1, 2)),
    student_id TEXT UNIQUE CHECK (student_id IS NULL OR LENGTH(TRIM(student_id)) > 0),
    email TEXT UNIQUE CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone_number TEXT CHECK (phone_number IS NULL OR LENGTH(TRIM(phone_number)) >= 10),
    address TEXT CHECK (address IS NULL OR LENGTH(TRIM(address)) > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_volunteers_enrollment_year ON public.volunteers(enrollment_academic_year);
CREATE INDEX idx_volunteers_nss_year ON public.volunteers(current_nss_year);
CREATE INDEX idx_volunteers_active ON public.volunteers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_volunteers_name ON public.volunteers(first_name, last_name);

COMMENT ON TABLE public.volunteers IS 'Individual volunteer profiles and information';
COMMENT ON COLUMN public.volunteers.enrollment_academic_year IS 'Academic year volunteer first enrolled in NSS (Format: YYYY-YYYY)';
COMMENT ON COLUMN public.volunteers.current_nss_year IS 'Current year in NSS program (1st or 2nd year)';

-- `user_roles` table: Links leads to their roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (lead_id, role_id)
);

CREATE INDEX idx_user_roles_lead ON public.user_roles(lead_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role_id);

COMMENT ON TABLE public.user_roles IS 'Role assignments for dashboard leads';

-- `events` table: NSS event details
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
    event_date DATE NOT NULL,
    declared_hours INT NOT NULL CHECK (declared_hours BETWEEN 1 AND 24),
    category TEXT NOT NULL CHECK (category IN ('Area Based - 1', 'Area Based - 2', 'University Event', 'College Event', 'Camp', 'Competition', 'Workshop', 'Other')),
    academic_session TEXT NOT NULL CHECK (public.validate_academic_year(academic_session)),
    location TEXT CHECK (location IS NULL OR LENGTH(TRIM(location)) > 0),
    description TEXT CHECK (description IS NULL OR LENGTH(TRIM(description)) > 0),
    max_participants INT CHECK (max_participants IS NULL OR max_participants > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_by_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
    updated_by_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for better query performance
CREATE INDEX idx_events_date ON public.events(event_date DESC);
CREATE INDEX idx_events_academic_session ON public.events(academic_session);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_active ON public.events(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE public.events IS 'NSS events with details and metadata';
COMMENT ON COLUMN public.events.declared_hours IS 'Official hours declared for the event (1-24)';

-- `event_participation` table: Volunteer participation in events
CREATE TABLE public.event_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    hours_attended INT NOT NULL CHECK (hours_attended >= 0),
    attendance_status TEXT DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'partial')),
    notes TEXT CHECK (notes IS NULL OR LENGTH(TRIM(notes)) > 0),
    added_by_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (volunteer_id, event_id)
);

-- Indexes for reporting and queries
CREATE INDEX idx_participation_volunteer ON public.event_participation(volunteer_id);
CREATE INDEX idx_participation_event ON public.event_participation(event_id);
CREATE INDEX idx_participation_status ON public.event_participation(attendance_status);

COMMENT ON TABLE public.event_participation IS 'Records of volunteer participation in events';

-- ======================================================================
-- 3. INSERT DEFAULT ROLES
-- ======================================================================
INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Full administrative access to all system functions'),
    ('program_officer', 'Overall program management and oversight'),
    ('event_lead', 'Event creation, management and participation tracking'),
    ('documentation_lead', 'Volunteer management and record keeping'),
    ('viewer', 'Read-only access for reporting and oversight');

-- ======================================================================
-- 4. CREATE ADDITIONAL HELPER FUNCTIONS
-- ======================================================================

-- Validate event hours don't exceed declared hours
CREATE OR REPLACE FUNCTION public.validate_event_hours(p_event_id UUID, p_hours_attended INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    declared_hours INT;
BEGIN
    SELECT e.declared_hours INTO declared_hours
    FROM public.events e
    WHERE e.id = p_event_id;
    
    IF declared_hours IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN p_hours_attended <= declared_hours;
END;
$$;

-- Role checking function for leads
CREATE OR REPLACE FUNCTION public.has_role(VARIADIC p_required_roles TEXT[])
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
        JOIN public.roles r ON ur.role_id = r.id
        JOIN public.leads l ON ur.lead_id = l.id
        WHERE l.auth_user_id = current_user_id 
        AND r.name = ANY(p_required_roles)
        AND r.is_active = TRUE
        AND l.is_active = TRUE
    ) INTO user_has_role;
    
    RETURN user_has_role;
END;
$$;

-- Get current lead info
CREATE OR REPLACE FUNCTION public.get_current_lead()
RETURNS TABLE (
    lead_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    roles TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        l.id,
        l.first_name,
        l.last_name,
        l.email,
        COALESCE(ARRAY_AGG(r.name), ARRAY[]::TEXT[]) as roles
    FROM public.leads l
    LEFT JOIN public.user_roles ur ON l.id = ur.lead_id
    LEFT JOIN public.roles r ON ur.role_id = r.id
    WHERE l.auth_user_id = auth.uid()
    AND l.is_active = TRUE
    GROUP BY l.id, l.first_name, l.last_name, l.email;
$$;

-- ======================================================================
-- 5. CREATE TRIGGERS
-- ======================================================================

-- Apply update triggers
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_volunteers_updated_at
    BEFORE UPDATE ON public.volunteers
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_participation_updated_at
    BEFORE UPDATE ON public.event_participation
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Add constraint trigger for event hours validation
CREATE CONSTRAINT TRIGGER validate_participation_hours
    AFTER INSERT OR UPDATE ON public.event_participation
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION (
        SELECT CASE 
            WHEN public.validate_event_hours(NEW.event_id, NEW.hours_attended) 
            THEN NULL 
            ELSE 'Hours attended cannot exceed declared event hours'
        END
    );

-- ======================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ======================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 7. RLS POLICIES
-- ======================================================================

-- Leads policies
CREATE POLICY "leads_self_management"
    ON public.leads FOR ALL
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "leads_admin_management"
    ON public.leads FOR ALL
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

CREATE POLICY "leads_read_access"
    ON public.leads FOR SELECT
    USING (public.has_role('admin', 'program_officer', 'event_lead', 'documentation_lead', 'viewer'));

-- Volunteers policies
CREATE POLICY "volunteers_management"
    ON public.volunteers FOR ALL
    USING (public.has_role('admin', 'program_officer', 'documentation_lead'))
    WITH CHECK (public.has_role('admin', 'program_officer', 'documentation_lead'));

CREATE POLICY "volunteers_read_access"
    ON public.volunteers FOR SELECT
    USING (public.has_role('admin', 'program_officer', 'documentation_lead', 'event_lead', 'viewer'));

-- Events policies
CREATE POLICY "events_management"
    ON public.events FOR ALL
    USING (public.has_role('admin', 'program_officer', 'event_lead'))
    WITH CHECK (public.has_role('admin', 'program_officer', 'event_lead'));

CREATE POLICY "events_read_access"
    ON public.events FOR SELECT
    USING (public.has_role('admin', 'program_officer', 'event_lead', 'documentation_lead', 'viewer'));

-- Event participation policies
CREATE POLICY "participation_management"
    ON public.event_participation FOR ALL
    USING (public.has_role('admin', 'program_officer', 'event_lead'))
    WITH CHECK (public.has_role('admin', 'program_officer', 'event_lead'));

CREATE POLICY "participation_read_access"
    ON public.event_participation FOR SELECT
    USING (public.has_role('admin', 'program_officer', 'event_lead', 'documentation_lead', 'viewer'));

-- Roles policies
CREATE POLICY "roles_admin_only"
    ON public.roles FOR ALL
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

CREATE POLICY "roles_read_access"
    ON public.roles FOR SELECT
    USING (auth.role() = 'authenticated');

-- User roles policies
CREATE POLICY "user_roles_admin_management"
    ON public.user_roles FOR ALL
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

CREATE POLICY "user_roles_self_read"
    ON public.user_roles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.leads l 
        WHERE l.id = lead_id AND l.auth_user_id = auth.uid()
    ));

-- ======================================================================
-- 8. HELPFUL VIEWS FOR FRONTEND
-- ======================================================================

-- Comprehensive volunteer summary with age calculation
CREATE OR REPLACE VIEW public.volunteer_summary AS
SELECT 
    v.id,
    v.first_name,
    v.last_name,
    v.first_name || ' ' || v.last_name as full_name,
    v.birth_date,
    CASE 
        WHEN v.birth_date IS NOT NULL 
        THEN public.calculate_age(v.birth_date)
        ELSE NULL 
    END as age,
    v.gender,
    v.enrollment_academic_year,
    v.current_nss_year,
    v.student_id,
    v.email,
    v.phone_number,
    v.is_active,
    COUNT(ep.id) as total_events_participated,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours_completed,
    MAX(e.event_date) as last_event_date,
    v.created_at,
    v.updated_at
FROM public.volunteers v
LEFT JOIN public.event_participation ep ON v.id = ep.volunteer_id
LEFT JOIN public.events e ON ep.event_id = e.id AND e.is_active = TRUE
GROUP BY v.id, v.first_name, v.last_name, v.birth_date, v.gender, 
         v.enrollment_academic_year, v.current_nss_year, v.student_id, 
         v.email, v.phone_number, v.is_active, v.created_at, v.updated_at;

-- Event summary with participation statistics
CREATE OR REPLACE VIEW public.event_summary AS
SELECT 
    e.id,
    e.name,
    e.event_date,
    e.declared_hours,
    e.category,
    e.academic_session,
    e.location,
    e.max_participants,
    COUNT(ep.id) as actual_participants,
    COUNT(CASE WHEN ep.attendance_status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ep.attendance_status = 'absent' THEN 1 END) as absent_count,
    COALESCE(AVG(ep.hours_attended), 0) as avg_hours_attended,
    COALESCE(MAX(ep.hours_attended), 0) as max_hours_attended,
    COALESCE(MIN(ep.hours_attended), 0) as min_hours_attended,
    l.first_name || ' ' || l.last_name as created_by,
    e.created_at,
    e.updated_at
FROM public.events e
LEFT JOIN public.event_participation ep ON e.id = ep.event_id
LEFT JOIN public.leads l ON e.created_by_lead_id = l.id
WHERE e.is_active = TRUE
GROUP BY e.id, e.name, e.event_date, e.declared_hours, e.category, 
         e.academic_session, e.location, e.max_participants, 
         l.first_name, l.last_name, e.created_at, e.updated_at;

-- Lead profile with roles
CREATE OR REPLACE VIEW public.lead_profiles AS
SELECT 
    l.id,
    l.auth_user_id,
    l.first_name,
    l.last_name,
    l.first_name || ' ' || l.last_name as full_name,
    l.email,
    l.phone_number,
    l.designation,
    l.is_active,
    COALESCE(ARRAY_AGG(r.name ORDER BY r.name), ARRAY[]::TEXT[]) as roles,
    COUNT(e.id) as events_created,
    l.created_at,
    l.updated_at
FROM public.leads l
LEFT JOIN public.user_roles ur ON l.id = ur.lead_id
LEFT JOIN public.roles r ON ur.role_id = r.id AND r.is_active = TRUE
LEFT JOIN public.events e ON l.id = e.created_by_lead_id AND e.is_active = TRUE
GROUP BY l.id, l.auth_user_id, l.first_name, l.last_name, l.email, 
         l.phone_number, l.designation, l.is_active, l.created_at, l.updated_at;

-- Grant access to views
GRANT SELECT ON public.volunteer_summary TO authenticated;
GRANT SELECT ON public.event_summary TO authenticated;
GRANT SELECT ON public.lead_profiles TO authenticated;

-- ======================================================================
-- SCHEMA COMPLETE - SUPABASE OPTIMIZED
-- ======================================================================