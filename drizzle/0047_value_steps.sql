-- Migration 0047: value steps on work entries (2026-07-03).
--
-- A study-level, editable taxonomy of "value steps" (stages of the customer's
-- value journey). Each flow work block can be tagged with ONE value step, so we
-- can see where failure/sequence work most appears. Mirrors work_step_types
-- (0010) + the failure-demand block reference (0033). Additive + opt-in
-- (value_steps_enabled default false), so existing studies are unaffected until
-- the toggle is turned on.

CREATE TABLE IF NOT EXISTS value_steps (
  id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL REFERENCES studies(id),
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE work_description_blocks
  ADD COLUMN IF NOT EXISTS value_step_id TEXT REFERENCES value_steps(id) ON DELETE SET NULL;

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS value_steps_enabled BOOLEAN NOT NULL DEFAULT false;
