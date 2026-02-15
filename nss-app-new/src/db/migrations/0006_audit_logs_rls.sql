-- Enable RLS on audit_logs and add policies
-- Only admins can read audit logs; inserts happen via app code (service role)

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- No direct inserts via client — app code inserts with service role (bypasses RLS)
CREATE POLICY "audit_logs_insert_deny"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- No updates allowed
CREATE POLICY "audit_logs_update_deny"
  ON audit_logs FOR UPDATE
  TO authenticated
  USING (false);

-- No deletes allowed — audit trail must be immutable
CREATE POLICY "audit_logs_delete_deny"
  ON audit_logs FOR DELETE
  TO authenticated
  USING (false);
