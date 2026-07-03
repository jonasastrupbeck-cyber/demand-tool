-- Migration 0045: DROP the retired decision layer (decision-box redesign cleanup).
--
-- ⚠️  DESTRUCTIVE — NOT additive. Do NOT apply until the redesign (slices 1-4)
-- has been verified on PRODUCTION and Jonas has explicitly agreed, per CLAUDE.md
-- rule 2 (schema changes are additive-only) and rule 3 (prod pushes are agreed
-- out of field-test hours). Everything this drops has already been migrated into
-- subquestions / subquestion_options / case_subquestion_answers (migration 0042)
-- and the event tokens re-pointed (0044). Run 0044 first.
--
-- Before running, confirm no code still reads these tables:
--   grep -rn "decisionPointTypes\|decisionOutcomeTypes\|decisionCaptureFields\|caseDecisionPoints\|caseDecisionValues" src/
-- (the dead handlers/routes/component + getCapabilityData's decision: branch and
-- the CSV export's Decisions sheet must be removed in the same release.)

DROP TABLE IF EXISTS case_decision_values;

DROP TABLE IF EXISTS case_decision_points;

DROP TABLE IF EXISTS decision_capture_fields;

DROP TABLE IF EXISTS decision_outcome_types;

DROP TABLE IF EXISTS decision_point_types;

-- Milestone completion is fully derived now (case_milestones.derived); the manual
-- achieved/not_achieved outcome is retired.
ALTER TABLE case_milestones DROP COLUMN IF EXISTS outcome;
