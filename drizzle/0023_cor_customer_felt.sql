-- 0023: COR-per-touch — customer-felt flag + customer-facing COR (C7, 2026-06-17).
--
-- A touch in flow capture is one user's block of work for one customer, closed
-- by ONE Capability of Response (COR = handling_type). C7 records whether that
-- touch was felt by the customer (customer-facing) or was an internal/partner
-- handoff. The default comes from the chosen COR's customer_facing flag but is
-- overridable per touch.
--
-- Both columns are additive and safe for existing rows:
--   * handling_types.customer_facing — NOT NULL DEFAULT false (mirrors the same
--     column on points_of_transaction / work_sources); existing CORs default to
--     internal until a consultant marks them customer-facing.
--   * demand_entries.customer_felt — nullable; NULL = not asked / legacy entry.

ALTER TABLE handling_types
  ADD COLUMN IF NOT EXISTS customer_facing BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE demand_entries
  ADD COLUMN IF NOT EXISTS customer_felt BOOLEAN;
