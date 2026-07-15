-- Consultant-archived cases (2026-07-15): a reversible "remove from the data" flag
-- for learning/practice captures. NULL = live; set = hidden from all dashboards +
-- the case list, recoverable (or permanently deleted) in Settings. PIN-gated.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
