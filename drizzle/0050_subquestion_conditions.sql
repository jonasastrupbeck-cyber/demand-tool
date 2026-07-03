-- Migration 0050: conditional visibility for subquestions (2026-07-03).
--
-- A "child" subquestion can be shown only when a "parent" CHOICE subquestion's
-- answer equals one of the configured trigger option labels (e.g. reveal
-- "Solicitor firm" + "Panel number" only when "Using fee-assisted legals?" = Yes;
-- reveal "Lower end of valuation range" only when the method = AVM).
--
-- A subquestion with NO rows here is ALWAYS shown (back-compat: every existing
-- subquestion). Multiple rows for one child = OR across trigger values. The
-- trigger is stored as the parent option LABEL, matching how answers store
-- value_choice. Additive & safe: a new table only.

CREATE TABLE IF NOT EXISTS subquestion_conditions (
  id text PRIMARY KEY,
  subquestion_id text NOT NULL REFERENCES subquestions(id) ON DELETE CASCADE,
  parent_subquestion_id text NOT NULL REFERENCES subquestions(id) ON DELETE CASCADE,
  trigger_value text NOT NULL,
  UNIQUE (subquestion_id, parent_subquestion_id, trigger_value)
);
CREATE INDEX IF NOT EXISTS subquestion_conditions_child_idx ON subquestion_conditions(subquestion_id);
CREATE INDEX IF NOT EXISTS subquestion_conditions_parent_idx ON subquestion_conditions(parent_subquestion_id);
