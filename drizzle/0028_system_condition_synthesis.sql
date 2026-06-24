-- 0028: System-condition synthesis — merge-in-place (2026-06-24).
--
-- The team studies captured system conditions as a distribution and finds
-- categories that are really the same thing (Same / Similar / Different). They
-- merge the sames+similars under one agreed name; the change must ripple to
-- every linked record (demand_entry_system_conditions + work_description_blocks)
-- with no export/re-import. Superseded conditions are SOFT-ARCHIVED, not deleted,
-- so the original wording stays traceable and a merge is reversible.
--
-- Additive only:
--   * system_conditions.archived_at / merged_into_id — soft-archive marker.
--     A condition with archived_at set vanishes from capture pickers + charts
--     (getSystemConditions filters it) but stays in the DB. merged_into_id
--     records which surviving condition it folded into.
--   * studies.synthesis_enabled — toggle-gate for the synthesis surface.
--   * system_condition_merges — one row per merge, recording exactly which
--     junction/block rows were re-pointed (JSON arrays in text) so undo can
--     replay it in reverse. prior_target_label restores a rename on undo.

ALTER TABLE system_conditions
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE system_conditions
  ADD COLUMN IF NOT EXISTS merged_into_id TEXT REFERENCES system_conditions(id);

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS synthesis_enabled BOOLEAN NOT NULL DEFAULT false;

-- system_conditions is referenced by THREE linked records, all re-pointed on
-- merge so nothing dangles to the archived condition:
--   * demand_entry_system_conditions (per-entry SC attachments)
--   * work_description_blocks.system_condition_id (per flow work block)
--   * demand_entry_thinking_scs.system_condition_id (thinking↔SC attachments)
-- Each moved_* column is a JSON-encoded record of exactly what changed so undo
-- can replay it in reverse.
CREATE TABLE IF NOT EXISTS system_condition_merges (
  id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL REFERENCES studies(id),
  target_id TEXT NOT NULL REFERENCES system_conditions(id),
  source_ids TEXT NOT NULL,
  moved_junction_ids TEXT NOT NULL,
  moved_block_ids TEXT NOT NULL,
  prior_target_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE system_condition_merges
  ADD COLUMN IF NOT EXISTS moved_thinking_scs TEXT NOT NULL DEFAULT '[]';
