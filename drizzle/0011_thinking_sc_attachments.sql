-- 0011: thinking ↔ system-condition attachments per demand entry.
--
-- Each thinking instance on an entry can be attached to zero or more system
-- conditions on the same entry, with a per-attachment helps/hinders dimension.
-- Mirrors the (demandEntryId, systemConditionId, dimension) shape used for
-- SC-to-field attachments at the field level, one step up.

CREATE TABLE IF NOT EXISTS demand_entry_thinking_scs (
  id                    TEXT PRIMARY KEY,
  demand_entry_id       TEXT NOT NULL REFERENCES demand_entries(id) ON DELETE CASCADE,
  thinking_id           TEXT NOT NULL REFERENCES thinkings(id),
  system_condition_id   TEXT NOT NULL REFERENCES system_conditions(id),
  dimension             TEXT NOT NULL DEFAULT 'hinders',
  UNIQUE (demand_entry_id, thinking_id, system_condition_id)
);
