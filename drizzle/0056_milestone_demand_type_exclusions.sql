-- Migration 0056: milestone-level demand-type EXCLUSIONS (2026-07-04).
-- Replaces the milestone INCLUDE model (0051) with an exclude model matching
-- subquestions: a milestone with rows here is skipped for a case whose demand-type
-- set intersects them. No rows = applies to every case.
CREATE TABLE IF NOT EXISTS milestone_demand_type_exclusions (
  id text PRIMARY KEY,
  milestone_id text NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  demand_type_id text NOT NULL REFERENCES demand_types(id) ON DELETE CASCADE,
  UNIQUE (milestone_id, demand_type_id)
);
CREATE INDEX IF NOT EXISTS milestone_dt_excl_ms_idx ON milestone_demand_type_exclusions(milestone_id);

-- Convert existing INCLUDE conditions to the EXCLUDE model: a milestone scoped to
-- include-set I now excludes every study demand type NOT in I (equivalent for the
-- usual single-demand-type case). Only milestones that had include rows are
-- touched; the old include rows are LEFT IN PLACE (dormant, unread) for safety.
INSERT INTO milestone_demand_type_exclusions (id, milestone_id, demand_type_id)
SELECT gen_random_uuid()::text, m.id, dt.id
FROM milestones m
JOIN demand_types dt ON dt.study_id = m.study_id
WHERE EXISTS (SELECT 1 FROM milestone_demand_type_conditions c WHERE c.milestone_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM milestone_demand_type_conditions c WHERE c.milestone_id = m.id AND c.demand_type_id = dt.id)
ON CONFLICT (milestone_id, demand_type_id) DO NOTHING;
