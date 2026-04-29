-- 0018: Classify work types as value / failure / sequence.
--
-- Mirrors workStepTypes.tag — a work type is intrinsically one of the three
-- categories. Capture form filters the dropdown by the active classification.
-- Existing rows backfill to 'value' (least disruptive); users re-classify via
-- the inline pills on the settings page.
--
-- Also adds a free-form text column on demand_entries to capture work-type
-- text when the user picks '?' (unknown) on the Work tab. work_type_id stays
-- NULL in that case.

ALTER TABLE work_types
  ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE work_types
  SET category = 'value'
  WHERE category IS NULL;

ALTER TABLE work_types
  ALTER COLUMN category SET NOT NULL;

ALTER TABLE demand_entries
  ADD COLUMN IF NOT EXISTS work_type_free_text TEXT;
