-- Migration 0042: decision-box redesign — subquestions on milestones (2026-07-02).
--
-- Flattens the decision-point layer: consultants define SUBQUESTIONS directly
-- under each milestone. The green/amber/red outcome pills and the manual
-- milestone achieved/not-achieved recording are retired; an "outcome" is now
-- just a choice subquestion whose options can carry positive/negative polarity.
-- Milestone completion becomes IMPLICIT (all required subquestions answered);
-- the completion date is the latest answer that completed it (answered_at).
--
-- ADDITIVE + self-migrating. The old decision tables are left fully intact and
-- still drive the current UI; this migration builds the new model ALONGSIDE and
-- backfills it from the old data so nothing is lost. Idempotent throughout
-- (IF NOT EXISTS + NOT EXISTS guards), so re-running is safe.
--
-- NOTE: the runner strips whole-line `--` comments and splits on `;`, so every
-- statement below is a single self-contained statement (no DO blocks, no inline
-- `--`, no `;` except the terminator).

CREATE TABLE IF NOT EXISTS subquestions (
  id TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  linked_what_matters_type_id TEXT REFERENCES what_matters_types(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  migrated_from_field_id TEXT
);

CREATE TABLE IF NOT EXISTS subquestion_options (
  id TEXT PRIMARY KEY,
  subquestion_id TEXT NOT NULL REFERENCES subquestions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  polarity TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS case_subquestion_answers (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  subquestion_id TEXT NOT NULL REFERENCES subquestions(id) ON DELETE CASCADE,
  value_number DOUBLE PRECISION,
  value_date TIMESTAMPTZ,
  value_years INTEGER,
  value_months INTEGER,
  value_choice TEXT,
  value_text TEXT,
  answered_at TIMESTAMPTZ NOT NULL,
  recorded_by_collector TEXT,
  CONSTRAINT case_subquestion_answers_unique UNIQUE (case_id, subquestion_id)
);

-- derived = FALSE marks a frozen historical/manual completion that the new
-- recompute helper must never touch; recompute only owns derived=TRUE rows.
ALTER TABLE case_milestones ADD COLUMN IF NOT EXISTS derived BOOLEAN NOT NULL DEFAULT FALSE;

-- BACKFILL A: orphan decision points (milestone_id NULL) get one synthetic
-- milestone per study so no subquestion is stranded. Deterministic id so it is
-- idempotent and referenceable without label matching.
INSERT INTO milestones (id, study_id, label, sort_order)
SELECT 'ms_migrated_'||d.study_id, d.study_id, 'Migrated decisions',
       COALESCE((SELECT max(sort_order)+1 FROM milestones m2 WHERE m2.study_id=d.study_id), 0)
FROM (SELECT DISTINCT study_id FROM decision_point_types WHERE milestone_id IS NULL) d
WHERE NOT EXISTS (SELECT 1 FROM milestones m3 WHERE m3.id='ms_migrated_'||d.study_id);

UPDATE decision_point_types dpt SET milestone_id='ms_migrated_'||dpt.study_id
WHERE dpt.milestone_id IS NULL;

-- BACKFILL B: every decision_capture_field becomes a subquestion on its decision
-- point's milestone. required=FALSE — these were optional delivered values, not
-- gates, so historical cases that left them blank still complete.
INSERT INTO subquestions (id, milestone_id, label, kind, required, linked_what_matters_type_id, sort_order, migrated_from_field_id)
SELECT gen_random_uuid()::text, dpt.milestone_id, dcf.label, dcf.kind, FALSE,
       dcf.linked_what_matters_type_id, dpt.sort_order*100 + dcf.sort_order, dcf.id
FROM decision_capture_fields dcf
JOIN decision_point_types dpt ON dpt.id=dcf.decision_point_type_id
WHERE dpt.milestone_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM subquestions sq WHERE sq.migrated_from_field_id=dcf.id);

-- BACKFILL C: each decision point's outcome set becomes ONE choice subquestion
-- (the gate), required=TRUE, labelled after the decision point.
INSERT INTO subquestions (id, milestone_id, label, kind, required, sort_order, migrated_from_field_id)
SELECT gen_random_uuid()::text, dpt.milestone_id, dpt.label, 'choice', TRUE, dpt.sort_order*100 + 99, 'outcome:'||dpt.id
FROM decision_point_types dpt
WHERE dpt.milestone_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM subquestions sq WHERE sq.migrated_from_field_id='outcome:'||dpt.id);

-- BACKFILL C2: outcome types become options carrying polarity (negative tone ->
-- negative, on_target/variation -> positive).
INSERT INTO subquestion_options (id, subquestion_id, label, polarity, sort_order)
SELECT gen_random_uuid()::text, sq.id, dot.label,
       CASE WHEN dot.tone='negative' THEN 'negative' ELSE 'positive' END, dot.sort_order
FROM decision_outcome_types dot
JOIN subquestions sq ON sq.migrated_from_field_id='outcome:'||dot.decision_point_type_id
WHERE NOT EXISTS (SELECT 1 FROM subquestion_options so WHERE so.subquestion_id=sq.id AND so.label=dot.label);

-- BACKFILL D: CSV choice_options on migrated choice fields become option rows
-- (polarity NULL — legacy free choices had no polarity).
INSERT INTO subquestion_options (id, subquestion_id, label, polarity, sort_order)
SELECT gen_random_uuid()::text, sq.id, trim(opt.val), NULL, opt.ord-1
FROM subquestions sq
JOIN decision_capture_fields dcf ON dcf.id=sq.migrated_from_field_id
CROSS JOIN LATERAL regexp_split_to_table(dcf.choice_options, ',') WITH ORDINALITY AS opt(val, ord)
WHERE dcf.kind='choice' AND dcf.choice_options IS NOT NULL AND trim(opt.val)<>''
  AND NOT EXISTS (SELECT 1 FROM subquestion_options so WHERE so.subquestion_id=sq.id AND so.label=trim(opt.val));

-- BACKFILL E: case_decision_values become answers. answered_at = the parent
-- decision's decided_at (the completion-date requirement).
INSERT INTO case_subquestion_answers (id, case_id, subquestion_id, value_number, value_date, value_years, value_months, value_choice, value_text, answered_at, recorded_by_collector)
SELECT gen_random_uuid()::text, cdv.case_id, sq.id, cdv.value_number, cdv.value_date, cdv.value_years, cdv.value_months, cdv.value_choice, NULL, cdp.decided_at, cdp.recorded_by_collector
FROM case_decision_values cdv
JOIN subquestions sq ON sq.migrated_from_field_id=cdv.field_id
JOIN decision_capture_fields dcf ON dcf.id=cdv.field_id
JOIN case_decision_points cdp ON cdp.case_id=cdv.case_id AND cdp.decision_point_type_id=dcf.decision_point_type_id
WHERE NOT EXISTS (SELECT 1 FROM case_subquestion_answers a WHERE a.case_id=cdv.case_id AND a.subquestion_id=sq.id);

-- BACKFILL F: each recorded decision's chosen outcome becomes an answer on the
-- outcome subquestion (value_choice = outcome label, answered_at = decided_at).
INSERT INTO case_subquestion_answers (id, case_id, subquestion_id, value_choice, answered_at, recorded_by_collector)
SELECT gen_random_uuid()::text, cdp.case_id, sq.id,
       COALESCE(dot.label, CASE WHEN cdp.outcome='negative' THEN dpt.negative_label ELSE dpt.positive_label END),
       cdp.decided_at, cdp.recorded_by_collector
FROM case_decision_points cdp
JOIN decision_point_types dpt ON dpt.id=cdp.decision_point_type_id
JOIN subquestions sq ON sq.migrated_from_field_id='outcome:'||cdp.decision_point_type_id
LEFT JOIN decision_outcome_types dot ON dot.id=cdp.decision_outcome_type_id
WHERE NOT EXISTS (SELECT 1 FROM case_subquestion_answers a WHERE a.case_id=cdp.case_id AND a.subquestion_id=sq.id);

-- BACKFILL H (person kind): willingness_to_pay becomes a Yes/No choice
-- subquestion on the person milestone. required=FALSE (informational, not a gate).
INSERT INTO subquestions (id, milestone_id, label, kind, required, sort_order, migrated_from_field_id)
SELECT gen_random_uuid()::text, dpt.milestone_id, 'Willingness to pay', 'choice', FALSE, dpt.sort_order*100 + 97, 'willingness:'||dpt.id
FROM decision_point_types dpt
WHERE dpt.kind='person' AND dpt.milestone_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM subquestions sq WHERE sq.migrated_from_field_id='willingness:'||dpt.id);

-- BACKFILL I (person kind): ability_to_pay becomes a Yes/No choice subquestion.
INSERT INTO subquestions (id, milestone_id, label, kind, required, sort_order, migrated_from_field_id)
SELECT gen_random_uuid()::text, dpt.milestone_id, 'Ability to pay', 'choice', FALSE, dpt.sort_order*100 + 98, 'ability:'||dpt.id
FROM decision_point_types dpt
WHERE dpt.kind='person' AND dpt.milestone_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM subquestions sq WHERE sq.migrated_from_field_id='ability:'||dpt.id);

-- BACKFILL J: Yes/No options for the willingness/ability subquestions (polarity NULL).
INSERT INTO subquestion_options (id, subquestion_id, label, polarity, sort_order)
SELECT gen_random_uuid()::text, sq.id, v.label, NULL, v.ord
FROM subquestions sq
CROSS JOIN (VALUES ('Yes',0),('No',1)) AS v(label,ord)
WHERE (sq.migrated_from_field_id LIKE 'willingness:%' OR sq.migrated_from_field_id LIKE 'ability:%')
  AND NOT EXISTS (SELECT 1 FROM subquestion_options so WHERE so.subquestion_id=sq.id AND so.label=v.label);

-- BACKFILL K: willingness answers.
INSERT INTO case_subquestion_answers (id, case_id, subquestion_id, value_choice, answered_at, recorded_by_collector)
SELECT gen_random_uuid()::text, cdp.case_id, sq.id,
       CASE WHEN cdp.willingness_to_pay THEN 'Yes' ELSE 'No' END, cdp.decided_at, cdp.recorded_by_collector
FROM case_decision_points cdp
JOIN subquestions sq ON sq.migrated_from_field_id='willingness:'||cdp.decision_point_type_id
WHERE cdp.willingness_to_pay IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM case_subquestion_answers a WHERE a.case_id=cdp.case_id AND a.subquestion_id=sq.id);

-- BACKFILL L: ability answers.
INSERT INTO case_subquestion_answers (id, case_id, subquestion_id, value_choice, answered_at, recorded_by_collector)
SELECT gen_random_uuid()::text, cdp.case_id, sq.id,
       CASE WHEN cdp.ability_to_pay THEN 'Yes' ELSE 'No' END, cdp.decided_at, cdp.recorded_by_collector
FROM case_decision_points cdp
JOIN subquestions sq ON sq.migrated_from_field_id='ability:'||cdp.decision_point_type_id
WHERE cdp.ability_to_pay IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM case_subquestion_answers a WHERE a.case_id=cdp.case_id AND a.subquestion_id=sq.id);
