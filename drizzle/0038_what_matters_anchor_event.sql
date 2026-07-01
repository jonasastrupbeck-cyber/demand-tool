-- 0038: ASAP what-matters anchor as an event token (2026-07-01).
--
-- Supersedes 0037's milestone-only anchor: the 'asap' type can now be measured
-- to EITHER a milestone or a decision point. Stored as a capability event token
-- ('milestone:<id>' or 'decision:<typeId>'). Nullable/additive; the old
-- anchor_milestone_id column stays in place (unused going forward). Backfill any
-- existing anchor_milestone_id into a milestone: token below (idempotent).

ALTER TABLE what_matters_types
  ADD COLUMN IF NOT EXISTS anchor_event TEXT;

UPDATE what_matters_types
  SET anchor_event = 'milestone:' || anchor_milestone_id
  WHERE anchor_milestone_id IS NOT NULL AND anchor_event IS NULL;
