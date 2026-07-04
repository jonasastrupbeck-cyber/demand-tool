-- Migration 0055: per-subquestion demand-type NOT-MANDATORY set (2026-07-04).
-- A required subquestion listed here is still SHOWN but does not gate milestone
-- completion for a case whose demand-type set intersects it (parallel to
-- subquestion_demand_type_exclusions, which HIDES + un-gates). No rows = normal.
CREATE TABLE IF NOT EXISTS subquestion_demand_type_optional (
  id text PRIMARY KEY,
  subquestion_id text NOT NULL REFERENCES subquestions(id) ON DELETE CASCADE,
  demand_type_id text NOT NULL REFERENCES demand_types(id) ON DELETE CASCADE,
  UNIQUE (subquestion_id, demand_type_id)
);
CREATE INDEX IF NOT EXISTS subq_dt_opt_subq_idx ON subquestion_demand_type_optional(subquestion_id);
