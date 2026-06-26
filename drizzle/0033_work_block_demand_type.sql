-- 0033: Per-block failure-demand type for flow work blocks (2026-06-26).
--
-- When a flow work block is tagged 'failure', a team can now record WHAT KIND
-- of failure demand hit at that step — mirroring the transactional per-entry
-- demand-type capture, but anchored to the block. ONE type per block (single
-- nullable FK, not a junction). NULL for value/sequence blocks and every
-- existing row. SET NULL mirrors work_step_type_id: deleting a demand type
-- reverts the block to "no type" (tag/text preserved).
--
-- A study-level opt-in gates the whole picker so transactional / non-flow
-- capture is byte-identical. Default false; independent of other flow toggles.
-- Both changes are additive.

ALTER TABLE work_description_blocks
  ADD COLUMN IF NOT EXISTS demand_type_id TEXT REFERENCES demand_types(id) ON DELETE SET NULL;

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS flow_failure_demand_types_enabled BOOLEAN NOT NULL DEFAULT false;
