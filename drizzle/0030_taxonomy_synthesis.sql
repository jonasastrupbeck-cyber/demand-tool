-- 0030: Extend synthesis (merge-in-place) to work types + work step types (2026-06-24).
--
-- Same shape as system-condition synthesis (0028) but simpler: these taxonomies
-- are linked by a SINGLE foreign key per record (no junction, no helps/hinders,
-- no dedupe), so a merge is just "re-point every linked record from the sources
-- to the survivor, then soft-archive the sources":
--   * work_types          ← demand_entries.work_type_id
--   * work_step_types      ← work_description_blocks.work_step_type_id
--
-- Soft-archive columns mirror 0028. One generic audit table covers both (and any
-- future single-FK taxonomy) via a `taxonomy` discriminator; `moved` is a JSON
-- array of {id, from} for the re-pointed link rows so undo replays in reverse.
-- Additive only.

ALTER TABLE work_types ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE work_types ADD COLUMN IF NOT EXISTS merged_into_id TEXT REFERENCES work_types(id);

ALTER TABLE work_step_types ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE work_step_types ADD COLUMN IF NOT EXISTS merged_into_id TEXT REFERENCES work_step_types(id);

CREATE TABLE IF NOT EXISTS taxonomy_merges (
  id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL REFERENCES studies(id),
  taxonomy TEXT NOT NULL,
  target_id TEXT NOT NULL,
  source_ids TEXT NOT NULL,
  moved TEXT NOT NULL,
  prior_target_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
