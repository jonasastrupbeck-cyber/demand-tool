-- 0032: Multiple system conditions per flow work block (2026-06-26).
--
-- Until now a block had at most ONE system condition (work_description_blocks.
-- system_condition_id, single FK). Teams want to tag several SCs on one step.
-- New many-to-many junction mirrors demand_entry_system_conditions. Backfill one
-- junction row per existing non-null block SC so nothing is lost; the old column
-- stays (additive rule) but is no longer the source of truth.
--
-- Merge cascade: a synthesis merge must re-point this junction the same way it
-- re-points demand_entry_system_conditions — recorded in a new audit column
-- moved_block_scs (legacy moved_block_ids kept for old merge records).

CREATE TABLE IF NOT EXISTS work_block_system_conditions (
  id TEXT PRIMARY KEY,
  work_block_id TEXT NOT NULL REFERENCES work_description_blocks(id) ON DELETE CASCADE,
  system_condition_id TEXT NOT NULL REFERENCES system_conditions(id),
  CONSTRAINT work_block_system_conditions_unique UNIQUE (work_block_id, system_condition_id)
);

INSERT INTO work_block_system_conditions (id, work_block_id, system_condition_id)
  SELECT 'wbsc-' || wdb.id, wdb.id, wdb.system_condition_id
  FROM work_description_blocks wdb
  WHERE wdb.system_condition_id IS NOT NULL
  ON CONFLICT DO NOTHING;

ALTER TABLE system_condition_merges
  ADD COLUMN IF NOT EXISTS moved_block_scs TEXT NOT NULL DEFAULT '[]';
