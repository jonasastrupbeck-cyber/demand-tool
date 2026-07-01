-- 0035: Make case_decision_points.cleanliness OPTIONAL (2026-06-26).
--
-- The clean/dirty decision pills were removed from capture (not needed). New
-- decisions no longer record a cleanliness, so relax the NOT NULL constraint.
-- Existing rows keep their values; nothing is dropped. Safe/additive-spirit.

ALTER TABLE case_decision_points
  ALTER COLUMN cleanliness DROP NOT NULL;
