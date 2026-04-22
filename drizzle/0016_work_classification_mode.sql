-- 0016: Work-tab classification preset.
--
-- Adds a per-study preset for which pills appear on the Work tab's Value /
-- Sequence / Failure / ? row. Demand tab unaffected.
--
-- Valid values:
--   'value-sequence-failure-unknown' (default) — all four pills, today's behaviour
--   'value-failure-unknown'                    — drops the Sequence pill
--
-- Default preserves current behaviour on existing studies.

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS work_classification_mode TEXT NOT NULL DEFAULT 'value-sequence-failure-unknown';
