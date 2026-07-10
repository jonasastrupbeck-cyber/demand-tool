-- Demand-type synthesis / merge (2026-07-10)
-- Lets value + failure demand types be merged in the Synthesise view, the same
-- way system conditions and work types already can. Adds the soft-archive
-- columns the merge machinery depends on (mirrors work_types / system_conditions).
-- The existing taxonomy_merges audit table is reused (its `taxonomy` column is
-- plain text and `moved` is a free-form JSON blob), so no new table is needed.
-- Additive only.

ALTER TABLE demand_types ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE demand_types ADD COLUMN IF NOT EXISTS merged_into_id TEXT;
