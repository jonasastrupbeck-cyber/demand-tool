-- Migration 0040: multiple life problems + value demands per case (2026-07-02).
-- Additive. Two junction tables mirroring case_what_matters. The single
-- cases.life_problem_id / cases.demand_type_id columns stay as the "primary"
-- (first-selected) so the P2BS dashboard filter and CSV export are unchanged.
-- Backfill seeds each case's existing single selection as its first junction
-- row. Idempotent: CREATE ... IF NOT EXISTS + ON CONFLICT DO NOTHING.

CREATE TABLE IF NOT EXISTS case_life_problems (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  life_problem_id TEXT NOT NULL REFERENCES life_problems(id),
  CONSTRAINT case_life_problems_unique UNIQUE (case_id, life_problem_id)
);

CREATE TABLE IF NOT EXISTS case_demand_types (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  demand_type_id TEXT NOT NULL REFERENCES demand_types(id),
  CONSTRAINT case_demand_types_unique UNIQUE (case_id, demand_type_id)
);

INSERT INTO case_life_problems (id, case_id, life_problem_id)
  SELECT 'clp_' || c.id, c.id, c.life_problem_id FROM cases c
  WHERE c.life_problem_id IS NOT NULL
  ON CONFLICT (case_id, life_problem_id) DO NOTHING;

INSERT INTO case_demand_types (id, case_id, demand_type_id)
  SELECT 'cdt_' || c.id, c.id, c.demand_type_id FROM cases c
  WHERE c.demand_type_id IS NOT NULL
  ON CONFLICT (case_id, demand_type_id) DO NOTHING;
