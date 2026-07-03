-- Migration 0051: dynamic milestones by value-demand type (2026-07-03).
--
-- A milestone can be scoped to one or more demand types, so it only APPLIES to a
-- case whose demand-type set intersects that scope. Non-applicable milestones are
-- neither shown in capture nor allowed to gate completion / auto-close — e.g. an
-- "additional borrowing" case skips conveyancing / certificate-of-title /
-- solicitor milestones instead of hanging on them.
--
-- A milestone with NO rows here applies to EVERY case (back-compat: every
-- existing milestone). Additive & safe: a new table only.

CREATE TABLE IF NOT EXISTS milestone_demand_type_conditions (
  id text PRIMARY KEY,
  milestone_id text NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  demand_type_id text NOT NULL REFERENCES demand_types(id) ON DELETE CASCADE,
  UNIQUE (milestone_id, demand_type_id)
);
CREATE INDEX IF NOT EXISTS milestone_dt_conditions_ms_idx ON milestone_demand_type_conditions(milestone_id);
