-- 0017: Work-tab classification row gate.
--
-- Independent boolean toggle that hides the Value / (Sequence) / Failure / ?
-- row on the Work tab. When false, work entries save with classification
-- defaulted to 'unknown'. Demand tab unaffected.
--
-- Default TRUE so existing studies keep today's behaviour.

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS work_classification_enabled BOOLEAN NOT NULL DEFAULT TRUE;
