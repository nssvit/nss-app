-- Quick Fix for Monthly Activity Trends Function
-- Run this in Supabase SQL Editor to fix the GROUP BY error

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

GRANT EXECUTE ON FUNCTION get_monthly_activity_trends() TO authenticated;
