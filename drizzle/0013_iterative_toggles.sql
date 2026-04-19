-- 0013: iterative-build toggles.
--
-- New study-level feature flags so teams can start a study minimal (just
-- verbatim) and layer in capability as they learn:
--   what_matters_enabled
--   thinkings_enabled
--   life_problems_enabled
--
-- Defaults are FALSE so NEW studies start minimal. We backfill existing
-- studies to preserve what they had implicitly on.

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS what_matters_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS thinkings_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS life_problems_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill so existing studies don't regress.
UPDATE studies SET what_matters_enabled = TRUE
  WHERE id IN (SELECT DISTINCT study_id FROM what_matters_types);
UPDATE studies SET thinkings_enabled = system_conditions_enabled
  WHERE system_conditions_enabled = TRUE;
UPDATE studies SET life_problems_enabled = TRUE;
