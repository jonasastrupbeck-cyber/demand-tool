-- 0057: enforce unique template name per system type (audit API-11).
-- The template save did a check-then-insert with no DB constraint, so two
-- concurrent saves of the same name could both insert. Idempotent (safe to
-- re-run); wrapped in a DO block so the apply-migration splitter keeps it whole.
--
-- NOTE: if this fails on production with a unique_violation, there are already
-- duplicate (name, system_type) template rows to resolve first (rename or delete
-- the older duplicate), then re-run.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'study_templates_name_system_type_unique'
  ) THEN
    ALTER TABLE study_templates
      ADD CONSTRAINT study_templates_name_system_type_unique UNIQUE (name, system_type);
  END IF;
END $$;
