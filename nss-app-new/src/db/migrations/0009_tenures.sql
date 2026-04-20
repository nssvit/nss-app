-- 0009: Tenure scoping for per-academic-year data isolation
-- Non-destructive. All existing rows are backfilled into a historical tenure
-- so nothing disappears from the DB, but the app only shows current-tenure
-- data by default.

-- ---------------------------------------------------------------------------
-- 1. tenures table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "tenures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "label" text NOT NULL UNIQUE,
  "start_date" date NOT NULL,
  "end_date" date,
  "is_current" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "tenures_label_format_check" CHECK ("label" ~ '^[0-9]{4}-[0-9]{4}$'),
  CONSTRAINT "tenures_dates_check" CHECK ("end_date" IS NULL OR "end_date" >= "start_date")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenures_only_one_current"
  ON "tenures" ("is_current") WHERE "is_current" = true;

CREATE INDEX IF NOT EXISTS "idx_tenures_start_date" ON "tenures" ("start_date");

DROP TRIGGER IF EXISTS "trg_tenures_updated_at" ON "tenures";
CREATE TRIGGER "trg_tenures_updated_at"
  BEFORE UPDATE ON "tenures"
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Seed historical tenure so backfill has a target
-- ---------------------------------------------------------------------------
INSERT INTO "tenures" ("label", "start_date", "end_date", "is_current")
VALUES ('2025-2026', '2025-06-01', '2026-05-31', true)
ON CONFLICT (label) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Add tenure_id to scoped tables (nullable first, backfill, then NOT NULL)
-- ---------------------------------------------------------------------------
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "tenure_id" uuid REFERENCES "tenures"("id");

ALTER TABLE "event_participation"
  ADD COLUMN IF NOT EXISTS "tenure_id" uuid REFERENCES "tenures"("id");

UPDATE "events"
SET "tenure_id" = (SELECT id FROM tenures WHERE label = '2025-2026')
WHERE "tenure_id" IS NULL;

UPDATE "event_participation"
SET "tenure_id" = (SELECT id FROM tenures WHERE label = '2025-2026')
WHERE "tenure_id" IS NULL;

ALTER TABLE "events" ALTER COLUMN "tenure_id" SET NOT NULL;
ALTER TABLE "event_participation" ALTER COLUMN "tenure_id" SET NOT NULL;

-- Indexes for the tenure filter used on every read
CREATE INDEX IF NOT EXISTS "idx_events_tenure" ON "events" ("tenure_id");
CREATE INDEX IF NOT EXISTS "idx_events_tenure_start"
  ON "events" ("tenure_id", "start_date");
CREATE INDEX IF NOT EXISTS "idx_participation_tenure_volunteer"
  ON "event_participation" ("tenure_id", "volunteer_id");

-- ---------------------------------------------------------------------------
-- 4. Volunteer lifecycle: active | completed | inactive
-- ---------------------------------------------------------------------------
ALTER TABLE "volunteers"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active';

ALTER TABLE "volunteers"
  DROP CONSTRAINT IF EXISTS "volunteers_status_check";
ALTER TABLE "volunteers"
  ADD CONSTRAINT "volunteers_status_check"
  CHECK ("status" IN ('active', 'completed', 'inactive'));

-- ---------------------------------------------------------------------------
-- 5. Convenience helper: current_tenure_id()
--    Usable in RLS, views, and raw SQL. Stable within a transaction.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenure_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT id FROM tenures WHERE is_current = true LIMIT 1;
$$;
