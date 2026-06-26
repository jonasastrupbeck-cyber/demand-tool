-- 0031: Per-block date for flow work blocks (2026-06-26).
--
-- A flow touch is one entry with a strip of work blocks (steps). Until now a
-- block had no date of its own — it inherited the entry's createdAt. Teams want
-- to backfill a missed step with its REAL date, so each block gets an optional
-- block_date. NULL = inherit the entry's createdAt (so every existing row and
-- all normal capture are unchanged). Over-time charts bucket a block by
-- COALESCE(block_date, entry.created_at). Additive, nullable.

ALTER TABLE work_description_blocks
  ADD COLUMN IF NOT EXISTS block_date TIMESTAMP WITH TIME ZONE;
