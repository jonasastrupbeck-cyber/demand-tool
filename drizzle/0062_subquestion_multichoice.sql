-- Multi-select decision-box answers (2026-07-10)
-- New subquestion kind 'multichoice' — reuses subquestion_options but the case
-- answer holds MULTIPLE selected option labels, stored as a JSON array of labels
-- in a new nullable text column. Additive only.

ALTER TABLE case_subquestion_answers ADD COLUMN IF NOT EXISTS value_choices TEXT;
