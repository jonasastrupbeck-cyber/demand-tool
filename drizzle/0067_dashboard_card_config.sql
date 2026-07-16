-- Per-study dashboard card layout (2026-07-16): drag-reorder + show/hide of the
-- dashboard chart cards, per view, persisted as a JSON blob keyed by view:
--   { [view]: { order: string[], hidden: string[] } }
-- Opt-in per study; null = default order, all cards visible. Additive, nullable
-- column — existing studies behave identically.
ALTER TABLE studies ADD COLUMN IF NOT EXISTS dashboard_card_config TEXT;
