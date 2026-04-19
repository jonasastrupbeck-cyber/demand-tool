-- 0012: dimension lives on the thinking instance, not the thinking↔SC attachment.
--
-- Per Jonas 2026-04-19: a thinking either helps or hinders purpose, like an SC
-- does at the instance level. The SC attachments become a simple many-to-many
-- link (thinking T on entry E is attached to SC S). No per-attachment dimension.

ALTER TABLE demand_entry_thinkings
  ADD COLUMN IF NOT EXISTS dimension TEXT NOT NULL DEFAULT 'hinders';

ALTER TABLE demand_entry_thinking_scs
  DROP COLUMN IF EXISTS dimension;
