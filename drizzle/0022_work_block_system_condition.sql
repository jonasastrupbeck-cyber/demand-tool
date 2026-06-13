-- 0022: Per-block system condition for flow-mode work blocks (2026-06-12).
--
-- In flow mode the "Work we did" path captures a strip of work blocks, each
-- tagged value/sequence/failure. Every sequence/failure block asks "which
-- system condition is driving this?" — anchored to the block, not the entry.
-- One SC per block. Nullable so value blocks and all existing rows are
-- unaffected. ON DELETE SET NULL mirrors work_step_type_id: deleting an SC
-- reverts the block to "no SC" without losing its tag/text.

ALTER TABLE work_description_blocks
  ADD COLUMN IF NOT EXISTS system_condition_id TEXT
  REFERENCES system_conditions(id) ON DELETE SET NULL;
