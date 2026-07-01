-- 0037: ASAP what-matters anchor milestone (2026-07-01).
--
-- The 'asap' standard what-matters type ("As soon as possible") is measured as
-- case open → a specific milestone reached. This stores that milestone on the
-- type (set once per study in Settings). Nullable/additive; plain id (no FK) —
-- a deleted milestone simply resolves to no data in the capability engine.

ALTER TABLE what_matters_types
  ADD COLUMN IF NOT EXISTS anchor_milestone_id TEXT;
