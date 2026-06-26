-- 0034: Explicit drag-reorder position for a flow case's touches (2026-06-26).
--
-- Saved touches (work entries) in a flow case render as a left→right timeline,
-- previously ordered purely by created_at (the data-entry time). This adds an
-- explicit per-entry order so the user can drag a saved touch into the right
-- place — including sequencing several touches on the same day. NULL means the
-- case has never been reordered, so getCaseEntries falls back to created_at
-- order (existing behaviour unchanged). Additive, nullable.

ALTER TABLE demand_entries
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;
