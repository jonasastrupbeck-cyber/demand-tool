-- Phase 3 / Ali feedback 2026-04-16: each System Condition attached to an
-- entry should be tagged with which of the five capture fields it helps or
-- hinders — LP2BS, Demand, What Matters, CoR, and Work.
--
-- Old model: one SC row per (entry, sc) with a single dimension (helps/hinders).
-- New model: same row shape + five boolean flags indicating the fields this
-- SC attaches to. Dimension stays a single value per (entry, sc) pair — if an
-- SC genuinely helps one field and hinders another, duplicate the pick (future
-- extension can drop the unique constraint if needed).
--
-- Backfill: existing rows are assumed to have been attached to the Demand
-- (matching the old implicit semantics, where SC was the "why this failed"
-- field for demand entries or "why not one-stop" for value demands).

ALTER TABLE demand_entry_system_conditions
  ADD COLUMN IF NOT EXISTS attaches_to_life_problem BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS attaches_to_demand       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS attaches_to_what_matters BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS attaches_to_cor          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS attaches_to_work         BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill existing rows
UPDATE demand_entry_system_conditions
SET attaches_to_demand = TRUE
WHERE attaches_to_demand = FALSE
  AND attaches_to_life_problem = FALSE
  AND attaches_to_what_matters = FALSE
  AND attaches_to_cor = FALSE
  AND attaches_to_work = FALSE;
