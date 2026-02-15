-- Create audit_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "action" text NOT NULL,
  "actor_id" uuid REFERENCES "volunteers"("id"),
  "target_type" text NOT NULL,
  "target_id" text,
  "details" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs" USING btree ("action");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor" ON "audit_logs" USING btree ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_target" ON "audit_logs" USING btree ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");
