-- Migration 0052: study templates (2026-07-04).
--
-- A template is a NAMED, FROZEN JSON snapshot of a study's SETTINGS — every
-- taxonomy list, milestone/subquestion structure, and feature toggle — never
-- captured data (no entries, cases, answers). Saved from a study's Settings
-- page; the consultant landing page lists templates per system type so a new
-- study can start with all settings copied (fresh ids, own access code).
-- `settings` is a JSON-encoded text blob (house style, cf. taxonomy_merges);
-- `snapshot_version` lets the apply code evolve the shape safely.
-- Additive & safe: a new table only.

CREATE TABLE IF NOT EXISTS study_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  system_type text NOT NULL,
  snapshot_version integer NOT NULL DEFAULT 1,
  settings text NOT NULL,
  source_study_id text REFERENCES studies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL
);
