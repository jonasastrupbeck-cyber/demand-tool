-- Migration 0054: per-subquestion demand-type EXCLUSIONS (2026-07-04).
-- A subquestion with rows here is hidden + non-gating for a case whose demand-type
-- set intersects them (exclude model — opposite of milestone_demand_type_conditions'
-- include model). No rows = applies to every case. Additive, safe.
CREATE TABLE IF NOT EXISTS subquestion_demand_type_exclusions (
  id text PRIMARY KEY,
  subquestion_id text NOT NULL REFERENCES subquestions(id) ON DELETE CASCADE,
  demand_type_id text NOT NULL REFERENCES demand_types(id) ON DELETE CASCADE,
  UNIQUE (subquestion_id, demand_type_id)
);
CREATE INDEX IF NOT EXISTS subq_dt_excl_subq_idx ON subquestion_demand_type_exclusions(subquestion_id);
