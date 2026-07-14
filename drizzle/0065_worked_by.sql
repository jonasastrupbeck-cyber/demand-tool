-- Worked-on-by capture (2026-07-14): per-touch attribution of who DID the work,
-- overridable from the current collector. Opt-in per study, default off.
ALTER TABLE demand_entries ADD COLUMN IF NOT EXISTS worked_by_name TEXT;
ALTER TABLE studies        ADD COLUMN IF NOT EXISTS worked_by_enabled BOOLEAN NOT NULL DEFAULT false;
