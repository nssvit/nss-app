-- =====================================================
-- SQL Function for User Management Stats
-- =====================================================
-- This function returns statistics about users in the system

CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users INTEGER,
  active_users INTEGER,
  pending_users INTEGER,
  admin_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_users,
    COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_users,
    0::INTEGER as pending_users, -- Can be updated based on your pending logic
    COUNT(*) FILTER (WHERE role_name = 'admin')::INTEGER as admin_count
  FROM users
  WHERE is_active = true; -- Only count active users in total
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;
