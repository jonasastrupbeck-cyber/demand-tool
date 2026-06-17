-- 0024: Decision-point sub-states (C9, 2026-06-17).
--
-- A milestone decision (e.g. "Decision on the person") can now carry the
-- affordability sub-states that feed it: Willingness to Pay (yes/no) and
-- Ability to Pay (yes/no), alongside the existing Accept/Decline outcome,
-- cleanliness and time-to-decision. decision_point_types.kind tells the UI
-- which sub-state template to render ('person' = show the pay sub-states;
-- NULL = standard outcome + cleanliness only).
--
-- All additive and safe for existing rows:
--   * decision_point_types.kind          — nullable text.
--   * case_decision_points.willingness_to_pay / ability_to_pay — nullable
--     booleans; only set for 'person'-kind milestones, NULL everywhere else.

ALTER TABLE decision_point_types
  ADD COLUMN IF NOT EXISTS kind TEXT;

ALTER TABLE case_decision_points
  ADD COLUMN IF NOT EXISTS willingness_to_pay BOOLEAN;

ALTER TABLE case_decision_points
  ADD COLUMN IF NOT EXISTS ability_to_pay BOOLEAN;
