-- Synthesise life problems + what-matters factors (2026-07-10)
-- Lets LP2BS (life_problems) and What Matters factors (what_matters_types) be
-- merged in the Synthesise view, like system conditions / demand types already
-- can. Adds the soft-archive columns the merge machinery depends on. The existing
-- taxonomy_merges audit table is reused (plain-text `taxonomy` + JSON `moved`).
-- Additive only.

ALTER TABLE life_problems      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE life_problems      ADD COLUMN IF NOT EXISTS merged_into_id TEXT;
ALTER TABLE what_matters_types ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE what_matters_types ADD COLUMN IF NOT EXISTS merged_into_id TEXT;
