-- ======================================================================
-- REFINED NSS DASHBOARD DATABASE SCHEMA - PRODUCTION READY
-- ======================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ======================================================================
-- 2. LOOKUP TABLES FOR CATEGORICAL DATA
-- ======================================================================

-- Gender types lookup
CREATE TABLE public.gender_types (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Event categories lookup
CREATE TABLE public.event_categories (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Attendance status lookup
CREATE TABLE public.attendance_statuses (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Academic sessions lookup
CREATE TABLE public.academic_sessions (
    id SERIAL PRIMARY KEY,
    session_name TEXT NOT NULL UNIQUE,
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CHECK (end_year = start_year + 1),
    CHECK (start_year >= 2020 AND start_year <= 2050)
);

-- ======================================================================
-- 3. CORE TABLES WITH REFINEMENTS
-- ======================================================================

-- Roles table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT CHECK (description IS NULL OR LENGTH(TRIM(description)) > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Leads table (refined)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL CHECK (LENGTH(TRIM(first_name)) > 0),
    last_name TEXT NOT NULL CHECK (LENGTH(TRIM(last_name)) > 0),
    email CITEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone_number TEXT CHECK (phone_number IS NULL OR LENGTH(TRIM(phone_number)) >= 10),
    designation TEXT CHECK (designation IS NULL OR LENGTH(TRIM(designation)) > 0),
    -- Normalized address fields
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Volunteers table (refined)
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
    -- Normalized address fields
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User roles table (refined)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (lead_id, role_id)
);

-- Events table (refined)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
    event_date DATE NOT NULL,
    declared_hours INT NOT NULL CHECK (declared_hours BETWEEN 1 AND 24),
    category_id INT NOT NULL REFERENCES public.event_categories(id),
    academic_session_id INT NOT NULL REFERENCES public.academic_sessions(id),
    -- Normalized location fields
    location_name TEXT,
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    description TEXT CHECK (description IS NULL OR LENGTH(TRIM(description)) > 0),
    max_participants INT CHECK (max_participants IS NULL OR max_participants > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_by_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
    updated_by_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Event participation table (refined)
CREATE TABLE public.event_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    hours_attended INT NOT NULL CHECK (hours_attended >= 0),
    attendance_status_id INT NOT NULL REFERENCES public.attendance_statuses(id),
    notes TEXT CHECK (notes IS NULL OR LENGTH(TRIM(notes)) > 0),
    added_by_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (volunteer_id, event_id)
);

-- ======================================================================
-- 4. AUDIT TRAIL TABLES
-- ======================================================================

-- Generic audit log table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES public.leads(id),
    changed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ======================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ======================================================================

-- Basic indexes
CREATE INDEX idx_leads_auth_user ON public.leads(auth_user_id);
CREATE INDEX idx_leads_active ON public.leads(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_volunteers_active ON public.volunteers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_volunteers_session ON public.volunteers(academic_session_id);
CREATE INDEX idx_events_date ON public.events(event_date DESC);
CREATE INDEX idx_events_session ON public.events(academic_session_id);
CREATE INDEX idx_events_category ON public.events(category_id);
CREATE INDEX idx_events_created_by ON public.events(created_by_lead_id);
CREATE INDEX idx_participation_volunteer ON public.event_participation(volunteer_id);
CREATE INDEX idx_participation_event ON public.event_participation(event_id);

-- GIN indexes for full-text search
CREATE INDEX idx_volunteers_name_gin ON public.volunteers USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_events_name_gin ON public.events USING gin (name gin_trgm_ops);
CREATE INDEX idx_events_description_gin ON public.events USING gin (description gin_trgm_ops);
CREATE INDEX idx_participation_notes_gin ON public.event_participation USING gin (notes gin_trgm_ops);

-- ======================================================================
-- 6. VALIDATION FUNCTIONS
-- ======================================================================

-- Auto-update timestamp function
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

-- Role checking function
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

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (table_name, operation, record_id, old_values, changed_by)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), 
                COALESCE(current_setting('app.current_user_id', true)::UUID, auth.uid()));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (table_name, operation, record_id, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true)::UUID, auth.uid()));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (table_name, operation, record_id, new_values, changed_by)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true)::UUID, auth.uid()));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================
-- 7. TRIGGERS
-- ======================================================================

-- Updated_at triggers
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

CREATE TRIGGER set_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
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

-- ======================================================================
-- 8. ROW LEVEL SECURITY
-- ======================================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "leads_self_management"
    ON public.leads FOR ALL
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "leads_admin_management"
    ON public.leads FOR ALL
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

CREATE POLICY "volunteers_management"
    ON public.volunteers FOR ALL
    USING (public.has_role('admin', 'program_officer', 'documentation_lead'))
    WITH CHECK (public.has_role('admin', 'program_officer', 'documentation_lead'));

CREATE POLICY "events_management"
    ON public.events FOR ALL
    USING (public.has_role('admin', 'program_officer', 'event_lead'))
    WITH CHECK (public.has_role('admin', 'program_officer', 'event_lead'));

-- ======================================================================
-- 9. OPTIMIZED VIEWS
-- ======================================================================

-- Volunteer summary with calculated fields
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
    v.is_active,
    COUNT(DISTINCT ep.id) as total_events_participated,
    COALESCE(SUM(ep.hours_attended), 0) as total_hours_completed,
    MAX(e.event_date) as last_event_date,
    v.created_at,
    v.updated_at
FROM public.volunteers v
LEFT JOIN public.gender_types gt ON v.gender_type_id = gt.id
LEFT JOIN public.academic_sessions acs ON v.academic_session_id = acs.id
LEFT JOIN public.event_participation ep ON v.id = ep.volunteer_id
LEFT JOIN public.events e ON ep.event_id = e.id AND e.is_active = TRUE
GROUP BY v.id, v.first_name, v.last_name, v.birth_date, gt.name,
         acs.session_name, v.current_nss_year, v.student_id,
         v.email, v.phone_number, v.is_active, v.created_at, v.updated_at;

-- Event summary with participation statistics
CREATE OR REPLACE VIEW public.event_summary AS
SELECT
    e.id,
    e.name,
    e.event_date,
    e.declared_hours,
    ec.name as category,
    acs.session_name as academic_session,
    e.location_name,
    e.max_participants,
    COUNT(DISTINCT ep.id) as actual_participants,
    COUNT(CASE WHEN ast.code = 'present' THEN ep.id END) as present_count,
    COUNT(CASE WHEN ast.code = 'absent' THEN ep.id END) as absent_count,
    COALESCE(AVG(ep.hours_attended), 0) as avg_hours_attended,
    l.first_name || ' ' || l.last_name as created_by_name,
    e.created_at,
    e.updated_at
FROM public.events e
LEFT JOIN public.event_categories ec ON e.category_id = ec.id
LEFT JOIN public.academic_sessions acs ON e.academic_session_id = acs.id
LEFT JOIN public.event_participation ep ON e.id = ep.event_id
LEFT JOIN public.attendance_statuses ast ON ep.attendance_status_id = ast.id
LEFT JOIN public.leads l ON e.created_by_lead_id = l.id
WHERE e.is_active = TRUE
GROUP BY e.id, e.name, e.event_date, e.declared_hours, ec.name,
         acs.session_name, e.location_name, e.max_participants,
         l.first_name, l.last_name, e.created_at, e.updated_at;

-- ======================================================================
-- 10. SEED DATA
-- ======================================================================

-- Insert default gender types
INSERT INTO public.gender_types (code, name) VALUES
    ('M', 'Male'),
    ('F', 'Female'),
    ('O', 'Other'),
    ('P', 'Prefer not to say');

-- Insert default event categories
INSERT INTO public.event_categories (code, name, description) VALUES
    ('AB1', 'Area Based - 1', 'Community service in adopted areas'),
    ('AB2', 'Area Based - 2', 'Extended community engagement'),
    ('UE', 'University Event', 'University-wide NSS activities'),
    ('CE', 'College Event', 'College-specific NSS programs'),
    ('CAMP', 'Camp', 'NSS camps and residential programs'),
    ('COMP', 'Competition', 'NSS competitions and contests'),
    ('WS', 'Workshop', 'Training workshops and seminars'),
    ('OTHER', 'Other', 'Miscellaneous NSS activities');

-- Insert default attendance statuses
INSERT INTO public.attendance_statuses (code, name) VALUES
    ('present', 'Present'),
    ('absent', 'Absent'),
    ('partial', 'Partial Attendance');

-- Insert default academic sessions
INSERT INTO public.academic_sessions (session_name, start_year, end_year) VALUES
    ('2023-2024', 2023, 2024),
    ('2024-2025', 2024, 2025),
    ('2025-2026', 2025, 2026);

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Full administrative access to all system functions'),
    ('program_officer', 'Overall program management and oversight'),
    ('event_lead', 'Event creation, management and participation tracking'),
    ('documentation_lead', 'Volunteer management and record keeping'),
    ('viewer', 'Read-only access for reporting and oversight');

-- ======================================================================
-- SCHEMA COMPLETE - PRODUCTION READY