-- 0019: Case stitching (Skipton slice 1, 2026-06-11).
--
-- One privacy-safe case reference number = one customer = one value demand.
-- A case is a CONTAINER: each pickup/handoff stays an ordinary demand_entries
-- row (own created_at, collector_name, handling_type_id, flow blocks) attached
-- via the new case_id column. The case timeline ordered by created_at is the
-- repeatable Capability-of-Response sequence. opened_at starts the end-to-end
-- clock (decision points arrive in a later slice). Enabled per-study via
-- case_tracking_enabled; default false so every existing study is untouched.
--
-- Also normalises a constraint-name mismatch: demand_entry_thinking_scs's
-- UNIQUE existed under a Postgres auto-truncated name (the schema.ts default
-- name exceeds the 63-char identifier limit), so every drizzle-kit push
-- re-prompted to add it. Replaced with an explicit short name that matches
-- schema.ts. Rows verified distinct before applying (5 rows on 2026-06-11).

ALTER TABLE demand_entry_thinking_scs
  DROP CONSTRAINT IF EXISTS demand_entry_thinking_scs_demand_entry_id_thinking_id_syste_key;
ALTER TABLE demand_entry_thinking_scs
  DROP CONSTRAINT IF EXISTS demand_entry_thinking_scs_demand_entry_id_thinking_id_system_co;
ALTER TABLE demand_entry_thinking_scs
  ADD CONSTRAINT demand_entry_thinking_scs_unique
  UNIQUE (demand_entry_id, thinking_id, system_condition_id);

ALTER TABLE demand_entry_system_conditions
  DROP CONSTRAINT IF EXISTS demand_entry_system_conditions_demand_entry_id_system_condition;
ALTER TABLE demand_entry_system_conditions
  ADD CONSTRAINT demand_entry_system_conditions_unique
  UNIQUE (demand_entry_id, system_condition_id);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL REFERENCES studies(id),
  case_ref TEXT NOT NULL,
  demand_type_id TEXT REFERENCES demand_types(id),
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  note TEXT,
  created_by_collector TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT cases_study_id_case_ref_unique UNIQUE (study_id, case_ref)
);

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS case_tracking_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE demand_entries
  ADD COLUMN IF NOT EXISTS case_id TEXT REFERENCES cases(id);
