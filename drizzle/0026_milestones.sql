-- 0026: Milestones — an ordered container layer above decision points
-- (Skipton mortgage journey, 2026-06-18). A milestone groups decision points
-- and carries its OWN per-case outcome (achieved / not_achieved + date),
-- separate from the decisions inside it. Milestones run chronologically;
-- a not_achieved milestone halts the journey and closes the case.
--
-- decision_point_types.milestone_id is SET NULL on delete (deleting a milestone
-- keeps its decision points, just unassigns them). case_milestones cascades on
-- both FKs. Additive only — backfill makes existing studies behave identically.

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL REFERENCES studies(id),
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE decision_point_types
  ADD COLUMN IF NOT EXISTS milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS case_milestones (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL,
  reached_at TIMESTAMP WITH TIME ZONE NOT NULL,
  recorded_by_collector TEXT,
  CONSTRAINT case_milestones_unique UNIQUE (case_id, milestone_id)
);

-- Backfill: one default milestone per study that already has decision points,
-- assign ALL its decision points to it, so existing studies behave identically
-- (one milestone wrapping everything → renders as one group, no locking).
INSERT INTO milestones (id, study_id, label, sort_order)
SELECT 'ms_default_' || s.id, s.id, 'Milestone 1', 0
FROM studies s
WHERE EXISTS (SELECT 1 FROM decision_point_types d WHERE d.study_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM milestones m WHERE m.study_id = s.id);

UPDATE decision_point_types d
SET milestone_id = 'ms_default_' || d.study_id
WHERE d.milestone_id IS NULL
  AND EXISTS (SELECT 1 FROM milestones m WHERE m.id = 'ms_default_' || d.study_id);
