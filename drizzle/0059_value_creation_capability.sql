-- Value creation capability (2026-07-09)
-- Per-work-entry reflective judgement of value-creation capability, captured in
-- the flow work composer next to COR/Save. Fixed 3-value enum stored as plain
-- TEXT on demand_entries (no taxonomy table). Opt-in per study, default off.
-- Additive only.

ALTER TABLE demand_entries
  ADD COLUMN IF NOT EXISTS value_creation_capability TEXT;

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS value_creation_capability_enabled BOOLEAN NOT NULL DEFAULT false;
