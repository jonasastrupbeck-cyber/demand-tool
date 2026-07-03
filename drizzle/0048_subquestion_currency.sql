-- Migration 0048: currency subquestion kind (2026-07-03).
--
-- A new subquestion kind 'currency' captures a monetary amount (stored in the
-- existing value_number column, like 'amount'/'number'/'percent') and formats it
-- with a currency symbol + thousand separators in the UI. The currency is fixed
-- PER QUESTION (author-set, defaulted from the study language at render), so this
-- adds one nullable column on subquestions. Additive & safe: existing rows keep
-- currency_code = NULL and it only matters for kind='currency'.

ALTER TABLE subquestions ADD COLUMN IF NOT EXISTS currency_code text;
