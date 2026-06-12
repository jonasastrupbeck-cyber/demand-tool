-- 0021: Decision points — the Skipton "dotted box" (2026-06-12).
--
-- A per-study taxonomy of end-to-end decision points (NOT a hardcoded
-- person/property/value enum — the tool stays generic; the three mortgage
-- points are seed data per locale). One case_decision_points row per decided
-- point per case; pending points have no row. E2E time per point is computed
-- as decided_at - cases.opened_at, never stored. Cleanliness (clean/dirty +
-- cause) is captured at the decision point only — per-step dirtiness is too
-- noisy (Skipton req 7).
--
-- The type FK cascades deliberately: deleting a decision-point type from
-- settings is a consultant taxonomy fix and takes its per-case records along.

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS decision_points_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS decision_point_types (
  id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL REFERENCES studies(id),
  label TEXT NOT NULL,
  positive_label TEXT NOT NULL,
  negative_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS case_decision_points (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  decision_point_type_id TEXT NOT NULL REFERENCES decision_point_types(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL,
  cleanliness TEXT NOT NULL,
  dirty_cause TEXT,
  decided_at TIMESTAMP WITH TIME ZONE NOT NULL,
  recorded_by_collector TEXT,
  CONSTRAINT case_decision_points_unique UNIQUE (case_id, decision_point_type_id)
);
