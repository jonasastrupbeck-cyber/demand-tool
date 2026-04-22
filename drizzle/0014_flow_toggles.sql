-- 0014: Flow toggles.
--
-- Flow (value work + waste) becomes opt-in per entry-type. Previously Flow
-- was hard-wired on for work captures only. Now a study can enable Flow
-- independently on demand captures, work captures, both, or neither.
--
-- Defaults FALSE so new studies start minimal. Backfill flow_work_enabled
-- to TRUE on existing studies so today's behaviour for work captures is
-- preserved.

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS flow_demand_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS flow_work_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Preserve today's behaviour for existing studies: Flow was always on for work.
UPDATE studies SET flow_work_enabled = TRUE;
