-- ============================================================
-- NSS APP - SCHEMA CLEANUP MIGRATION
-- Migration: 0002_schema_cleanup.sql
--
-- This migration:
--   1. Converts events.start_date and end_date from DATE to TIMESTAMP WITH TZ
--   2. Drops the redundant events.event_date column
--   3. Drops event_participation.declared_hours (source of truth is events.declared_hours)
--   4. Drops 6 unused admin SQL functions (replaced by Drizzle queries)
--   5. Updates CHECK constraints for the new column types
--
-- Run via: npm run db:setup
-- ============================================================


-- ============================================================
-- PART 1: EVENTS TABLE - FIX DATE COLUMNS
-- Convert start_date and end_date from DATE to TIMESTAMP WITH TZ
-- This allows storing both date AND time for events
-- ============================================================

-- Drop the old CHECK constraint that compares dates (will recreate for timestamps)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_dates_check;

-- Convert start_date from DATE to TIMESTAMP WITH TIME ZONE
-- Existing date values become midnight timestamps automatically
ALTER TABLE public.events
  ALTER COLUMN start_date TYPE timestamp with time zone
  USING start_date::timestamp with time zone;

-- Convert end_date from DATE to TIMESTAMP WITH TIME ZONE
ALTER TABLE public.events
  ALTER COLUMN end_date TYPE timestamp with time zone
  USING end_date::timestamp with time zone;

-- Recreate the dates check constraint for timestamps
ALTER TABLE public.events
  ADD CONSTRAINT events_dates_check CHECK (end_date >= start_date);


-- ============================================================
-- PART 2: DROP REDUNDANT events.event_date COLUMN
-- start_date and end_date now handle both date and time
-- ============================================================

ALTER TABLE public.events DROP COLUMN IF EXISTS event_date;


-- ============================================================
-- PART 3: DROP event_participation.declared_hours
-- Source of truth for declared hours is events.declared_hours
-- Per-participation copy was confusing and inconsistently used
-- ============================================================

ALTER TABLE public.event_participation DROP COLUMN IF EXISTS declared_hours;


-- ============================================================
-- PART 4: DROP UNUSED ADMIN SQL FUNCTIONS
-- These are fully replaced by Drizzle ORM queries in:
--   src/db/queries/volunteers.ts (adminUpdateVolunteer)
--   src/db/queries/roles.ts (adminAssignRole, adminRevokeRole)
--
-- Helper functions (is_admin, has_role, get_current_volunteer_id)
-- are KEPT for future RLS policy use.
-- ============================================================

-- Revoke grants first
REVOKE EXECUTE ON FUNCTION public.admin_delete_volunteer(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_deactivate_volunteer(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reactivate_volunteer(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_assign_role(UUID, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_role(UUID, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_verify_volunteer(UUID) FROM authenticated;

-- Drop the functions
DROP FUNCTION IF EXISTS public.admin_delete_volunteer(UUID);
DROP FUNCTION IF EXISTS public.admin_deactivate_volunteer(UUID);
DROP FUNCTION IF EXISTS public.admin_reactivate_volunteer(UUID);
DROP FUNCTION IF EXISTS public.admin_assign_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.admin_revoke_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.admin_verify_volunteer(UUID);


-- ============================================================
-- VERIFICATION: Check the final state
-- ============================================================

-- Verify events columns
DO $$
DECLARE
  col_type text;
BEGIN
  -- Check start_date is timestamp
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'events' AND column_name = 'start_date';

  IF col_type != 'timestamp with time zone' THEN
    RAISE EXCEPTION 'start_date should be timestamp with time zone, got %', col_type;
  END IF;

  -- Check event_date is gone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'event_date'
  ) THEN
    RAISE EXCEPTION 'event_date column should have been dropped';
  END IF;

  -- Check declared_hours is gone from event_participation
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_participation' AND column_name = 'declared_hours'
  ) THEN
    RAISE EXCEPTION 'declared_hours column should have been dropped from event_participation';
  END IF;

  RAISE NOTICE 'Migration 0002 verification passed';
END $$;
