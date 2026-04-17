-- Phase 4 — Work Step Types (Jonas 2026-04-16, Ali foreshadowed in original
-- mockup note "the description will eventually be synthesised and then in the
-- settings toggle will turn the free form into a list").
--
-- New per-study managed taxonomy so each Flow block can reference a curated
-- step instead of being free-text. Tag is fixed at taxonomy level (value vs
-- failure is fundamental). Free-text fallback stays available on individual
-- blocks so the picker isn't a cage.

CREATE TABLE IF NOT EXISTS work_step_types (
  id                      TEXT PRIMARY KEY,
  study_id                TEXT NOT NULL REFERENCES studies(id),
  label                   TEXT NOT NULL,
  tag                     TEXT NOT NULL,
  operational_definition  TEXT,
  sort_order              INTEGER NOT NULL DEFAULT 0
);

-- Nullable FK on work_description_blocks. ON DELETE SET NULL means deleting
-- a Work Step Type reverts referencing blocks to free-text (their text + tag
-- are preserved, so no data loss).
ALTER TABLE work_description_blocks
  ADD COLUMN IF NOT EXISTS work_step_type_id TEXT REFERENCES work_step_types(id) ON DELETE SET NULL;

-- Study toggle — nested under work_tracking_enabled in the UI, but a plain
-- boolean in the schema (mirrors work_types_enabled).
ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS work_step_types_enabled BOOLEAN NOT NULL DEFAULT FALSE;
