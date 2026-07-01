-- 0036: Time-based "what matters" — capture a date & measure it (2026-07-01).
--
-- Two standard time-flavoured what-matters types sit alongside the free-form
-- ones: "When I want it" (a specific target date) and "As soon as possible"
-- (clock from case open). This adds:
--   • what_matters_types.timing — NULL = ordinary free-form factor (unchanged);
--     'by_date' = customer wants it by a specific date; 'asap' = from case open.
--   • case_what_matters.target_date — the customer's wanted date, set per case
--     only for a 'by_date' type.
-- Both nullable/additive; existing types and cases behave identically.

ALTER TABLE what_matters_types
  ADD COLUMN IF NOT EXISTS timing TEXT;

ALTER TABLE case_what_matters
  ADD COLUMN IF NOT EXISTS target_date TIMESTAMP WITH TIME ZONE;
