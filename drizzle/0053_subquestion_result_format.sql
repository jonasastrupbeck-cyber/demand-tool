-- Migration 0053: calculated-field result format (2026-07-04).
-- null = plain number (back-compat); 'percent' = multiply the computed value by
-- 100 and show with a % sign (e.g. LTV amount÷valuation 0.8 → 80%). Only
-- meaningful for kind='calculated', mirroring currency_code for kind='currency'.
-- Additive & safe: one nullable column.
ALTER TABLE subquestions ADD COLUMN IF NOT EXISTS result_format text;
