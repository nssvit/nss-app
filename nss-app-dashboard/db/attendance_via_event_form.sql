-- =====================================================
-- SQL Scripts for Attendance Tracking via Event Form
-- =====================================================
-- This script provides the functionality to mark attendance
-- directly when creating/editing events in the event form.
-- =====================================================

-- =====================================================
-- 1. Function to Mark Attendance for Multiple Volunteers
-- =====================================================
-- This function adds participants to an event and marks them as present
-- Call this when saving the event form with selected volunteers

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
      'present',  -- Mark as present
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

-- =====================================================
-- 2. Function to Remove Unmarked Attendees
-- =====================================================
-- This removes volunteers who are NO LONGER selected in the form
-- Call this to keep attendance in sync with the form selection

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

-- =====================================================
-- 3. Combined Function - Mark Attendance & Sync
-- =====================================================
-- This is the main function to call when saving the event form
-- It both adds new attendees and removes deselected ones

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

-- =====================================================
-- 4. Usage Examples
-- =====================================================

-- Example 1: Mark attendance when creating/editing an event
-- SELECT * FROM update_event_attendance(
--   'event-uuid-here'::UUID,
--   ARRAY['volunteer-1-uuid', 'volunteer-2-uuid', 'volunteer-3-uuid']::UUID[],
--   'admin-volunteer-uuid'::UUID
-- );

-- Example 2: Clear all attendance for an event
-- SELECT * FROM update_event_attendance(
--   'event-uuid-here'::UUID,
--   ARRAY[]::UUID[],  -- Empty array removes all
--   'admin-volunteer-uuid'::UUID
-- );

-- Example 3: Get current attendance for an event
-- SELECT
--   v.first_name,
--   v.last_name,
--   v.roll_number,
--   ep.participation_status,
--   ep.hours_attended,
--   ep.attendance_date
-- FROM event_participation ep
-- JOIN volunteers v ON v.id = ep.volunteer_id
-- WHERE ep.event_id = 'event-uuid-here'::UUID
--   AND ep.participation_status = 'present'
-- ORDER BY v.first_name;

-- =====================================================
-- 5. Indexes for Performance
-- =====================================================

-- Index for faster attendance queries
CREATE INDEX IF NOT EXISTS idx_event_participation_status
ON event_participation(event_id, participation_status);

-- Index for volunteer lookups
CREATE INDEX IF NOT EXISTS idx_event_participation_volunteer
ON event_participation(volunteer_id, participation_status);

-- =====================================================
-- 6. Grant Permissions
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION mark_event_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION sync_event_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION update_event_attendance TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
-- To use this in your application:
-- 1. Run this script in your Supabase SQL Editor
-- 2. When saving an event form, call update_event_attendance()
--    with the event ID and array of selected volunteer IDs
-- 3. The function will automatically handle adding/removing participants
-- =====================================================
