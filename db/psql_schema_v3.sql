-- ======================================================================
-- NSS DASHBOARD DATABASE SCHEMA v3 - PRODUCTION FINAL
-- Supabase Optimized with Enhanced Features
-- ======================================================================

-- Drop existing schema if exists (for clean deployment)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop policies first
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('leads', 'volunteers', 'events', 'event_participation', 'user_roles', 'roles')
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;

    -- Drop views
    DROP VIEW IF EXISTS public.volunteer_summary CASCADE;
    DROP VIEW IF EXISTS public.event_summary CASCADE;
    DROP VIEW IF EXISTS public.lead_profiles CASCADE;
    DROP VIEW IF EXISTS public.participation_details CASCADE;

    -- Drop tables with CASCADE
    DROP TABLE IF EXISTS public.audit_logs CASCADE;
    DROP TABLE IF EXISTS public.event_participation CASCADE;
    DROP TABLE IF EXISTS public.user_roles CASCADE;
    DROP TABLE IF EXISTS public.events CASCADE;
    DROP TABLE IF EXISTS public.volunteers CASCADE;
    DROP TABLE IF EXISTS public.leads CASCADE;
    DROP TABLE IF EXISTS public.roles CASCADE;
    DROP TABLE IF EXISTS public.attendance_statuses CASCADE;
    DROP TABLE IF EXISTS public.event_categories CASCADE;
    DROP TABLE IF EXISTS public.academic_sessions CASCADE;
    DROP TABLE IF EXISTS public.gender_types CASCADE;

    -- Drop functions
    DROP FUNCTION IF EXISTS public.has_role(VARIADIC TEXT[]) CASCADE;
    DROP FUNCTION IF EXISTS public.get_current_lead() CASCADE;
    DROP FUNCTION IF EXISTS public.trigger_set_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS public.validate_event_hours(UUID, INT) CASCADE;
    DROP FUNCTION IF EXISTS public.check_participation_hours_constraint() CASCADE;
    DROP FUNCTION IF EXISTS public.audit_trigger() CASCADE;
    DROP FUNCTION IF EXISTS public.calculate_volunteer_stats(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.search_volunteers(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.search_events(TEXT) CASCADE;
END $$;

-- ======================================================================
-- 1. EXTENSIONS
-- ======================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ======================================================================
-- 2. LOOKUP TABLES FOR CATEGORICAL DATA
-- ======================================================================

-- Gender types lookup
CREATE TABLE public.gender_types (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(code)) > 0),
    name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) > 0),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Event categories lookup
CREATE TABLE public.event_categories (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(code)) > 0),
    name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT,
    color_hex TEXT CHECK (color_hex IS NULL OR color_hex ~* '^#[0-9A-F]{6}$'),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Attendance status lookup
CREATE TABLE public.attendance_statuses (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(code)) > 0),
    name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT,
    color_hex TEXT CHECK (color_hex IS NULL OR color_hex ~* '^#[0-9A-F]{6}$'),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Academic sessions lookup
CREATE TABLE public.academic_sessions (
    id SERIAL PRIMARY KEY,
    session_name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(session_name)) > 0),
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CHECK (end_year = start_year + 1),
    CHECK (start_year >= 2020 AND start_year <= 2050)
);

-- ======================================================================
-- 3. CORE TABLES
-- ======================================================================

-- Roles table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT CHECK (description IS NULL OR LENGTH(TRIM(description)) > 0),
    permissions JSONB DEFAULT '{}',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Leads table (dashboard users)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL CHECK (LENGTH(TRIM(first_name)) > 0),
    last_name TEXT NOT NULL CHECK (LENGTH(TRIM(last_name)) > 0),
    email CITEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone_number TEXT CHECK (phone_number IS NULL OR LENGTH(TRIM(phone_number)) >= 10),
    designation TEXT CHECK (designation IS NULL OR LENGTH(TRIM(designation)) > 0),
    department TEXT CHECK (department IS NULL OR LENGTH(TRIM(department)) > 0),
    -- Address fields
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    -- Additional fields
    profile_picture_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Volunteers table
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL CHECK (LENGTH(TRIM(first_name)) > 0),
    last_name TEXT NOT NULL CHECK (LENGTH(TRIM(last_name)) > 0),
    birth_date DATE CHECK (birth_date IS NULL OR (birth_date <= CURRENT_DATE AND birth_date >= '1990-01-01')),
    gender_type_id INT REFERENCES public.gender_types(id),
    academic_session_id INT NOT NULL REFERENCES public.academic_sessions(id),
    current_nss_year INT NOT NULL CHECK (current_nss_year IN (1, 2)),
    student_id TEXT UNIQUE CHECK (student_id IS NULL OR LENGTH(TRIM(student_id)) > 0),
    email CITEXT UNIQUE CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone_number TEXT CHECK (phone_number IS NULL OR LENGTH(TRIM(phone_number)) >= 10),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    -- Address fields
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    -- Academic fields
    course TEXT,
    branch TEXT,
    semester INT CHECK (semester IS NULL OR semester BETWEEN 1 AND 8),
    -- Additional fields
    profile_picture_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User roles junction table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (lead_id, role_id)
);

-- Events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
    event_date DATE NOT NULL,
    end_date DATE,
    declared_hours INT NOT NULL CHECK (declared_hours BETWEEN 1 AND 24),
    category_id INT NOT NULL REFERENCES public.event_categories(id),
    academic_session_id INT NOT NULL REFERENCES public.academic_sessions(id),
    -- Location fields
    location_name TEXT,
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    -- Event details
    description TEXT CHECK (description IS NULL OR LENGTH(TRIM(description)) > 0),
    objectives TEXT,
    expected_outcome TEXT,
    max_participants INT CHECK (max_participants IS NULL OR max_participants > 0),
    min_participants INT CHECK (min_participants IS NULL OR min_participants > 0),
    registration_deadline DATE,
    -- Status and metadata
    event_status TEXT DEFAULT 'planned' CHECK (event_status IN ('planned', 'ongoing', 'completed', 'cancelled')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
    updated_by_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CHECK (end_date IS NULL OR end_date >= event_date),
    CHECK (min_participants IS NULL OR max_participants IS NULL OR min_participants <= max_participants)
);

-- Event participation table
CREATE TABLE public.event_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    hours_attended INT NOT NULL CHECK (hours_attended >= 0),
    attendance_status_id INT NOT NULL REFERENCES public.attendance_statuses(id),
    notes TEXT CHECK (notes IS NULL OR LENGTH(TRIM(notes)) > 0),
    feedback TEXT,
    rating INT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url TEXT,
    added_by_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
    updated_by_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (volunteer_id, event_id)
);

-- ======================================================================
-- 4. AUDIT TRAIL TABLE
-- ======================================================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    changed_by UUID,
    user_ip INET,
    user_agent TEXT,
    changed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ======================================================================
-- 5. PERFORMANCE INDEXES
-- ======================================================================

-- Basic lookup indexes
CREATE INDEX idx_gender_types_active ON public.gender_types(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_event_categories_active ON public.event_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_attendance_statuses_active ON public.attendance_statuses(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_academic_sessions_active ON public.academic_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_academic_sessions_current ON public.academic_sessions(is_current) WHERE is_current = TRUE;

-- Core table indexes
CREATE INDEX idx_leads_auth_user ON public.leads(auth_user_id);
CREATE INDEX idx_leads_active ON public.leads(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_leads_email ON public.leads(email);

CREATE INDEX idx_volunteers_active ON public.volunteers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_volunteers_session ON public.volunteers(academic_session_id);
CREATE INDEX idx_volunteers_year ON public.volunteers(current_nss_year);
CREATE INDEX idx_volunteers_student_id ON public.volunteers(student_id) WHERE student_id IS NOT NULL;

CREATE INDEX idx_user_roles_lead ON public.user_roles(lead_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_events_date ON public.events(event_date DESC);
CREATE INDEX idx_events_session ON public.events(academic_session_id);
CREATE INDEX idx_events_category ON public.events(category_id);
CREATE INDEX idx_events_created_by ON public.events(created_by_lead_id);
CREATE INDEX idx_events_status ON public.events(event_status);
CREATE INDEX idx_events_active ON public.events(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_participation_volunteer ON public.event_participation(volunteer_id);
CREATE INDEX idx_participation_event ON public.event_participation(event_id);
CREATE INDEX idx_participation_status ON public.event_participation(attendance_status_id);
CREATE INDEX idx_participation_certificate ON public.event_participation(certificate_issued);

-- Audit log indexes
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_operation ON public.audit_logs(operation);
CREATE INDEX idx_audit_logs_changed_at ON public.audit_logs(changed_at DESC);
CREATE INDEX idx_audit_logs_changed_by ON public.audit_logs(changed_by);

-- Full-text search indexes
CREATE INDEX idx_volunteers_name_search ON public.volunteers USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_events_name_search ON public.events USING gin (name gin_trgm_ops);
CREATE INDEX idx_events_description_search ON public.events USING gin (description gin_trgm_ops);

-- ======================================================================
-- 6. UTILITY FUNCTIONS
-- ======================================================================

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate event hours constraint
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

    RETURN p_hours_attended >= 0 AND p_hours_attended <= declared_hours;
END;
$$;

-- Check participation hours constraint
CREATE OR REPLACE FUNCTION public.check_participation_hours_constraint()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT public.validate_event_hours(NEW.event_id, NEW.hours_attended) THEN
        RAISE EXCEPTION 'Hours attended (%) exceeds declared hours for event %', 
            NEW.hours_attended, NEW.event_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Role checking function with enhanced security
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
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
    ) INTO user_has_role;

    RETURN user_has_role;
END;
$$;

-- Get current lead information
CREATE OR REPLACE FUNCTION public.get_current_lead()
RETURNS TABLE (
    lead_id UUID,
    first_name TEXT,
    last_name TEXT,
    email CITEXT,
    roles TEXT[],
    permissions JSONB
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
        COALESCE(ARRAY_AGG(r.name ORDER BY r.name), ARRAY[]::TEXT[]) as roles,
        COALESCE(jsonb_agg(r.permissions ORDER BY r.name), '{}'::jsonb) as permissions
    FROM public.leads l
    LEFT JOIN public.user_roles ur ON l.id = ur.lead_id AND ur.is_active = TRUE
    LEFT JOIN public.roles r ON ur.role_id = r.id AND r.is_active = TRUE
    WHERE l.auth_user_id = auth.uid()
    AND l.is_active = TRUE
    GROUP BY l.id, l.first_name, l.last_name, l.email;
$$;

-- Enhanced audit trigger
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    column_name TEXT;
    old_val TEXT;
    new_val TEXT;
BEGIN
    current_user_id := COALESCE(
        current_setting('app.current_user_id', true)::UUID,
        auth.uid()
    );

    -- For UPDATE operations, identify changed fields
    IF TG_OP = 'UPDATE' THEN
        FOR column_name IN SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('updated_at', 'created_at')
        LOOP
            EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', column_name, column_name)
            INTO old_val, new_val
            USING OLD, NEW;
            
            IF old_val IS DISTINCT FROM new_val THEN
                changed_fields := array_append(changed_fields, column_name);
            END IF;
        END LOOP;
    END IF;

    -- Insert audit record
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (table_name, operation, record_id, old_values, changed_by)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), current_user_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (table_name, operation, record_id, old_values, new_values, changed_fields, changed_by)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW), changed_fields, current_user_id);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (table_name, operation, record_id, new_values, changed_by)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW), current_user_id);
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Search functions
CREATE OR REPLACE FUNCTION public.search_volunteers(p_search_term TEXT)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email CITEXT,
    student_id TEXT,
    academic_session TEXT,
    similarity REAL
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        v.id,
        v.first_name || ' ' || v.last_name as full_name,
        v.email,
        v.student_id,
        acs.session_name as academic_session,
        GREATEST(
            similarity(v.first_name || ' ' || v.last_name, p_search_term),
            similarity(COALESCE(v.email::TEXT, ''), p_search_term),
            similarity(COALESCE(v.student_id, ''), p_search_term)
        ) as similarity
    FROM public.volunteers v
    JOIN public.academic_sessions acs ON v.academic_session_id = acs.id
    WHERE v.is_active = TRUE
    AND (
        v.first_name || ' ' || v.last_name ILIKE '%' || p_search_term || '%'
        OR v.email::TEXT ILIKE '%' || p_search_term || '%'
        OR v.student_id ILIKE '%' || p_search_term || '%'
    )
    ORDER BY similarity DESC, v.first_name, v.last_name
    LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.search_events(p_search_term TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    event_date DATE,
    category TEXT,
    similarity REAL
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        e.id,
        e.name,
        e.event_date,
        ec.name as category,
        GREATEST(
            similarity(e.name, p_search_term),
            similarity(COALESCE(e.description, ''), p_search_term),
            similarity(COALESCE(e.location_name, ''), p_search_term)
        ) as similarity
    FROM public.events e
    JOIN public.event_categories ec ON e.category_id = ec.id
    WHERE e.is_active = TRUE
    AND (
        e.name ILIKE '%' || p_search_term || '%'
        OR e.description ILIKE '%' || p_search_term || '%'
        OR e.location_name ILIKE '%' || p_search_term || '%'
    )
    ORDER BY similarity DESC, e.event_date DESC
    LIMIT 50;
$$;

-- ======================================================================
-- 7. TRIGGERS
-- ======================================================================

-- Updated_at triggers
CREATE TRIGGER set_gender_types_updated_at
    BEFORE UPDATE ON public.gender_types
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_event_categories_updated_at
    BEFORE UPDATE ON public.event_categories
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_attendance_statuses_updated_at
    BEFORE UPDATE ON public.attendance_statuses
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_academic_sessions_updated_at
    BEFORE UPDATE ON public.academic_sessions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
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

-- Business rule validation triggers
CREATE CONSTRAINT TRIGGER validate_participation_hours
    AFTER INSERT OR UPDATE ON public.event_participation
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public.check_participation_hours_constraint();

-- Audit triggers
CREATE TRIGGER audit_leads_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_volunteers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.volunteers
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_events_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_participation_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.event_participation
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_user_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ======================================================================
-- 8. ROW LEVEL SECURITY
-- ======================================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 9. RLS POLICIES
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

-- Audit logs policies
CREATE POLICY "audit_logs_admin_access"
    ON public.audit_logs FOR SELECT
    USING (public.has_role('admin'));

CREATE POLICY "audit_logs_program_officer_access"
    ON public.audit_logs FOR SELECT
    USING (public.has_role('program_officer'));

-- ======================================================================
-- 10. OPTIMIZED VIEWS
-- ======================================================================

-- Comprehensive volunteer summary
CREATE OR REPLACE VIEW public.volunteer_summary AS
SELECT
    v.id,
    v.first_name,
    v.last_name,
    v.first_name || ' ' || v.last_name as full_name,
    v.birth_date,
    CASE
        WHEN v.birth_date IS NOT NULL
        THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, v.birth_date))::INT
        ELSE NULL
    END as age,
    gt.name as gender,
    acs.session_name as academic_session,
    v.current_nss_year,
    v.student_id,
    v.email,
    v.phone_number,
    v.course,
    v.branch,
    v.semester,
    v.is_active,
    -- Participation statistics
    COUNT(DISTINCT ep.id) as total_events_participated,
    COUNT(DISTINCT CASE WHEN ast.code = 'present' THEN ep.id END) as events_attended,
    COUNT(DISTINCT CASE WHEN ast.code = 'absent' THEN ep.id END) as events_missed,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours_completed,
    COALESCE(AVG(ep.hours_attended), 0) as avg_hours_per_event,
    MAX(e.event_date) as last_event_date,
    COUNT(DISTINCT CASE WHEN ep.certificate_issued = TRUE THEN ep.id END) as certificates_earned,
    COALESCE(AVG(ep.rating), 0) as avg_event_rating,
    -- Profile completeness
    (CASE WHEN v.email IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN v.phone_number IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN v.birth_date IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN v.street_address IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN v.course IS NOT NULL THEN 1 ELSE 0 END) * 20 as profile_completeness_percent,
    v.created_at,
    v.updated_at
FROM public.volunteers v
LEFT JOIN public.gender_types gt ON v.gender_type_id = gt.id
LEFT JOIN public.academic_sessions acs ON v.academic_session_id = acs.id
LEFT JOIN public.event_participation ep ON v.id = ep.volunteer_id
LEFT JOIN public.events e ON ep.event_id = e.id AND e.is_active = TRUE
LEFT JOIN public.attendance_statuses ast ON ep.attendance_status_id = ast.id
GROUP BY v.id, v.first_name, v.last_name, v.birth_date, gt.name,
         acs.session_name, v.current_nss_year, v.student_id,
         v.email, v.phone_number, v.course, v.branch, v.semester,
         v.is_active, v.created_at, v.updated_at;

-- Comprehensive event summary
CREATE OR REPLACE VIEW public.event_summary AS
SELECT
    e.id,
    e.name,
    e.event_date,
    e.end_date,
    e.declared_hours,
    ec.name as category,
    ec.color_hex as category_color,
    acs.session_name as academic_session,
    e.location_name,
    e.city,
    e.state,
    e.max_participants,
    e.min_participants,
    e.event_status,
    -- Participation statistics
    COUNT(DISTINCT ep.id) as total_participants,
    COUNT(DISTINCT CASE WHEN ast.code = 'present' THEN ep.id END) as present_count,
    COUNT(DISTINCT CASE WHEN ast.code = 'absent' THEN ep.id END) as absent_count,
    COUNT(DISTINCT CASE WHEN ast.code = 'partial' THEN ep.id END) as partial_count,
    -- Hours statistics
    COALESCE(AVG(ep.hours_attended), 0) as avg_hours_attended,
    COALESCE(MAX(ep.hours_attended), 0) as max_hours_attended,
    COALESCE(MIN(ep.hours_attended), 0) as min_hours_attended,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours_logged,
    -- Rating and feedback
    COALESCE(AVG(ep.rating), 0) as avg_rating,
    COUNT(DISTINCT CASE WHEN ep.feedback IS NOT NULL THEN ep.id END) as feedback_count,
    COUNT(DISTINCT CASE WHEN ep.certificate_issued = TRUE THEN ep.id END) as certificates_issued,
    -- Metadata
    l.first_name || ' ' || l.last_name as created_by_name,
    ul.first_name || ' ' || ul.last_name as updated_by_name,
    e.created_at,
    e.updated_at
FROM public.events e
LEFT JOIN public.event_categories ec ON e.category_id = ec.id
LEFT JOIN public.academic_sessions acs ON e.academic_session_id = acs.id
LEFT JOIN public.event_participation ep ON e.id = ep.event_id
LEFT JOIN public.attendance_statuses ast ON ep.attendance_status_id = ast.id
LEFT JOIN public.leads l ON e.created_by_lead_id = l.id
LEFT JOIN public.leads ul ON e.updated_by_lead_id = ul.id
WHERE e.is_active = TRUE
GROUP BY e.id, e.name, e.event_date, e.end_date, e.declared_hours,
         ec.name, ec.color_hex, acs.session_name, e.location_name,
         e.city, e.state, e.max_participants, e.min_participants,
         e.event_status, l.first_name, l.last_name,
         ul.first_name, ul.last_name, e.created_at, e.updated_at;

-- Lead profiles with role information
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
    l.department,
    l.is_active,
    -- Role information
    COALESCE(ARRAY_AGG(r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::TEXT[]) as roles,
    COALESCE(jsonb_agg(r.permissions ORDER BY r.name) FILTER (WHERE r.permissions IS NOT NULL), '[]'::jsonb) as permissions,
    -- Activity statistics
    COUNT(DISTINCT e.id) as events_created,
    COUNT(DISTINCT ep.id) as participations_recorded,
    MAX(e.event_date) as last_event_created,
    l.last_login_at,
    l.created_at,
    l.updated_at
FROM public.leads l
LEFT JOIN public.user_roles ur ON l.id = ur.lead_id AND ur.is_active = TRUE
LEFT JOIN public.roles r ON ur.role_id = r.id AND r.is_active = TRUE
LEFT JOIN public.events e ON l.id = e.created_by_lead_id AND e.is_active = TRUE
LEFT JOIN public.event_participation ep ON l.id = ep.added_by_lead_id
GROUP BY l.id, l.auth_user_id, l.first_name, l.last_name, l.email,
         l.phone_number, l.designation, l.department, l.is_active,
         l.last_login_at, l.created_at, l.updated_at;

-- Detailed participation view
CREATE OR REPLACE VIEW public.participation_details AS
SELECT
    ep.id,
    ep.volunteer_id,
    ep.event_id,
    v.first_name || ' ' || v.last_name as volunteer_name,
    v.student_id,
    v.email as volunteer_email,
    e.name as event_name,
    e.event_date,
    e.declared_hours,
    ep.hours_attended,
    ast.name as attendance_status,
    ast.color_hex as status_color,
    ep.notes,
    ep.feedback,
    ep.rating,
    ep.certificate_issued,
    ep.certificate_url,
    al.first_name || ' ' || al.last_name as added_by_name,
    ul.first_name || ' ' || ul.last_name as updated_by_name,
    ep.created_at,
    ep.updated_at
FROM public.event_participation ep
JOIN public.volunteers v ON ep.volunteer_id = v.id
JOIN public.events e ON ep.event_id = e.id
JOIN public.attendance_statuses ast ON ep.attendance_status_id = ast.id
JOIN public.leads al ON ep.added_by_lead_id = al.id
LEFT JOIN public.leads ul ON ep.updated_by_lead_id = ul.id
WHERE v.is_active = TRUE AND e.is_active = TRUE;

-- ======================================================================
-- 11. SEED DATA
-- ======================================================================

-- Insert default gender types
INSERT INTO public.gender_types (code, name, display_order) VALUES
    ('M', 'Male', 1),
    ('F', 'Female', 2),
    ('O', 'Other', 3),
    ('N', 'Prefer not to say', 4);

-- Insert default event categories
INSERT INTO public.event_categories (code, name, description, color_hex, display_order) VALUES
    ('AB1', 'Area Based - 1', 'Community service in adopted areas', '#4CAF50', 1),
    ('AB2', 'Area Based - 2', 'Extended community engagement', '#8BC34A', 2),
    ('UE', 'University Event', 'University-wide NSS activities', '#2196F3', 3),
    ('CE', 'College Event', 'College-specific NSS programs', '#03A9F4', 4),
    ('CAMP', 'Camp', 'NSS camps and residential programs', '#FF9800', 5),
    ('COMP', 'Competition', 'NSS competitions and contests', '#E91E63', 6),
    ('WS', 'Workshop', 'Training workshops and seminars', '#9C27B0', 7),
    ('RALLY', 'Rally/Awareness', 'Public awareness campaigns', '#F44336', 8),
    ('OTHER', 'Other', 'Miscellaneous NSS activities', '#757575', 9);

-- Insert default attendance statuses
INSERT INTO public.attendance_statuses (code, name, description, color_hex, display_order) VALUES
    ('present', 'Present', 'Fully attended the event', '#4CAF50', 1),
    ('absent', 'Absent', 'Did not attend the event', '#F44336', 2),
    ('partial', 'Partial', 'Attended part of the event', '#FF9800', 3),
    ('excused', 'Excused', 'Absent with valid reason', '#2196F3', 4);

-- Insert default academic sessions
INSERT INTO public.academic_sessions (session_name, start_year, end_year, is_current) VALUES
    ('2023-2024', 2023, 2024, FALSE),
    ('2024-2025', 2024, 2025, TRUE),
    ('2025-2026', 2025, 2026, FALSE),
    ('2026-2027', 2026, 2027, FALSE);

-- Insert default roles with permissions
INSERT INTO public.roles (name, description, permissions, display_order) VALUES
    ('admin', 'Full administrative access to all system functions', 
     '{"create": ["*"], "read": ["*"], "update": ["*"], "delete": ["*"]}', 1),
    ('program_officer', 'Overall program management and oversight', 
     '{"create": ["volunteers", "events", "reports"], "read": ["*"], "update": ["volunteers", "events"], "delete": ["events"]}', 2),
    ('event_lead', 'Event creation, management and participation tracking', 
     '{"create": ["events", "participation"], "read": ["volunteers", "events", "participation"], "update": ["events", "participation"], "delete": ["events"]}', 3),
    ('documentation_lead', 'Volunteer management and record keeping', 
     '{"create": ["volunteers"], "read": ["volunteers", "events", "participation"], "update": ["volunteers"], "delete": []}', 4),
    ('viewer', 'Read-only access for reporting and oversight', 
     '{"create": [], "read": ["volunteers", "events", "participation", "reports"], "update": [], "delete": []}', 5);

-- ======================================================================
-- 12. GRANTS AND PERMISSIONS
-- ======================================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to views
GRANT SELECT ON public.volunteer_summary TO authenticated;
GRANT SELECT ON public.event_summary TO authenticated;
GRANT SELECT ON public.lead_profiles TO authenticated;
GRANT SELECT ON public.participation_details TO authenticated;

-- ======================================================================
-- SCHEMA COMPLETE - PRODUCTION READY v3
-- ======================================================================

-- Add helpful comments for documentation
COMMENT ON SCHEMA public IS 'NSS Dashboard Database Schema v3 - Production Ready';
COMMENT ON TABLE public.leads IS 'Dashboard users (leads/administrators) with enhanced profiles';
COMMENT ON TABLE public.volunteers IS 'NSS volunteers with comprehensive profile information';
COMMENT ON TABLE public.events IS 'NSS events with detailed metadata and location information';
COMMENT ON TABLE public.event_participation IS 'Volunteer participation records with feedback and certificates';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all data changes';
COMMENT ON FUNCTION public.has_role(VARIADIC TEXT[]) IS 'Role-based access control function with expiration support';
COMMENT ON VIEW public.volunteer_summary IS 'Comprehensive volunteer statistics and profile information';
COMMENT ON VIEW public.event_summary IS 'Detailed event statistics with participation metrics'; 