-- Migration 0046: DROP the retired decision layer (2026-07-03).
--
-- Phase 2 of retiring the decision layer. Fully decoupled: by the time this
-- runs, no code references these tables or case_milestones.outcome (removed in
-- the Phase-1 code cleanup, which shipped with 0045 making outcome nullable).
-- Everything here was migrated into subquestions / subquestion_options /
-- case_subquestion_answers (0042) and event tokens re-pointed (0044).
--
-- ⚠️ DESTRUCTIVE. Apply whenever convenient AFTER the Phase-1 code is live on
-- prod (order between this and the deploy no longer matters — nothing writes the
-- dropped structures). Run 0042-0045 first.

DROP TABLE IF EXISTS case_decision_values;

DROP TABLE IF EXISTS case_decision_points;

DROP TABLE IF EXISTS decision_capture_fields;

DROP TABLE IF EXISTS decision_outcome_types;

DROP TABLE IF EXISTS decision_point_types;

ALTER TABLE case_milestones DROP COLUMN IF EXISTS outcome;
