-- 0020: System type + case-level person context (2026-06-11).
--
-- Two ways into the tool. studies.system_type is the LAYOUT REGIME:
-- 'transactional' (today's interface — atomic entries, entry-level person
-- context) or 'flow' (case-first: the case carries context & situation,
-- the problem to be solved, and what matters; touches are lean). The strand
-- toggles keep working independently in both regimes. Default 'transactional'
-- so every existing study is untouched with no backfill.
--
-- Case-level person context per Ali's wireframe (Account Ref / Context &
-- Situation / P2BS / What Matters live on the case in a flow-based system).
-- case_what_matters mirrors demand_entry_what_matters one level up.

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS system_type TEXT NOT NULL DEFAULT 'transactional';

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS context_situation TEXT;
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS life_problem_id TEXT REFERENCES life_problems(id);
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS what_matters TEXT;

CREATE TABLE IF NOT EXISTS case_what_matters (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  what_matters_type_id TEXT NOT NULL REFERENCES what_matters_types(id),
  CONSTRAINT case_what_matters_unique UNIQUE (case_id, what_matters_type_id)
);
