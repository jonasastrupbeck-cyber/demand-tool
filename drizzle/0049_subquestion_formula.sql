-- Migration 0049: calculated (formula) subquestion kind (2026-07-03).
--
-- A new subquestion kind 'calculated' is a read-only box whose value is derived
-- from sibling subquestions via a safe expression (see src/lib/formula.ts). The
-- expression references siblings by a stable {sq:<id>} token and supports + - * /,
-- parentheses, and the helpers MONTHS()/MONTHS_BETWEEN(). The computed result is
-- persisted to the existing value_number column on save. Additive & safe: one
-- nullable column, meaningful only for kind='calculated'.

ALTER TABLE subquestions ADD COLUMN IF NOT EXISTS formula text;
