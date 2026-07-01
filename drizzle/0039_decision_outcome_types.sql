-- 0039: multiple outcomes per decision point (2026-07-01).
--
-- A decision point stops being one-green / one-red and becomes a LIST of
-- outcomes, each toned on_target (green) / variation (amber) / negative (red).
-- on_target + variation are positive (carry the case forward); negative is not.
-- Additive + self-seeding: every existing decision point gets its two current
-- labels as one on_target + one negative outcome, and existing case decisions
-- are backfilled to point at the matching seeded outcome — so untouched studies
-- behave identically. Idempotent (IF NOT EXISTS + NOT EXISTS / IS NULL guards).
--
-- NOTE: the runner strips whole-line `--` comments and splits on `;`, so every
-- statement below is a single self-contained statement (no DO blocks).

CREATE TABLE IF NOT EXISTS decision_outcome_types (
  id TEXT PRIMARY KEY,
  decision_point_type_id TEXT NOT NULL REFERENCES decision_point_types(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  tone TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE case_decision_points
  ADD COLUMN IF NOT EXISTS decision_outcome_type_id TEXT REFERENCES decision_outcome_types(id) ON DELETE SET NULL;

INSERT INTO decision_outcome_types (id, decision_point_type_id, label, tone, sort_order)
  SELECT gen_random_uuid()::text, dpt.id, dpt.positive_label, 'on_target', 0
  FROM decision_point_types dpt
  WHERE NOT EXISTS (
    SELECT 1 FROM decision_outcome_types o
    WHERE o.decision_point_type_id = dpt.id AND o.tone = 'on_target'
  );

INSERT INTO decision_outcome_types (id, decision_point_type_id, label, tone, sort_order)
  SELECT gen_random_uuid()::text, dpt.id, dpt.negative_label, 'negative', 1
  FROM decision_point_types dpt
  WHERE NOT EXISTS (
    SELECT 1 FROM decision_outcome_types o
    WHERE o.decision_point_type_id = dpt.id AND o.tone = 'negative'
  );

UPDATE case_decision_points cdp
  SET decision_outcome_type_id = o.id
  FROM decision_outcome_types o
  WHERE o.decision_point_type_id = cdp.decision_point_type_id
    AND o.tone = 'on_target'
    AND cdp.outcome = 'positive'
    AND cdp.decision_outcome_type_id IS NULL;

UPDATE case_decision_points cdp
  SET decision_outcome_type_id = o.id
  FROM decision_outcome_types o
  WHERE o.decision_point_type_id = cdp.decision_point_type_id
    AND o.tone = 'negative'
    AND cdp.outcome = 'negative'
    AND cdp.decision_outcome_type_id IS NULL;
