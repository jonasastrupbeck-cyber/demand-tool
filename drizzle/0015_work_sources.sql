-- 0015: Work sources taxonomy.
--
-- Captures "Where did the work come from?" as an opt-in session-sticky pill
-- on the Work tab, mirroring the shape of points_of_transaction (label,
-- customerFacing flag, sortOrder). Enabled per-study via the new
-- work_sources_enabled toggle; referenced from demand_entries when a work
-- entry is saved.

CREATE TABLE IF NOT EXISTS work_sources (
  id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL REFERENCES studies(id),
  label TEXT NOT NULL,
  customer_facing BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS work_sources_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE demand_entries
  ADD COLUMN IF NOT EXISTS work_source_id TEXT REFERENCES work_sources(id);
