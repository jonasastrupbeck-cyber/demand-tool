-- Migration 0041: structured what-matters asks + decision capture fields (2026-07-02).
-- Additive. Slice 1: what_matters_types gain an on/off capture toggle and a
-- value_kind ('amount' | 'date_or_duration', null = plain factor);
-- case_what_matters gains typed ask-value columns (target_date already exists
-- and doubles as the date half of date_or_duration).
-- Slice 2: decision_capture_fields (per-decision-point taxonomy of typed boxes,
-- optionally linked to a what-matters type) + case_decision_values (one row per
-- case per field). Idempotent: IF NOT EXISTS throughout; defaults keep every
-- existing study behaving identically (enabled=true, value_kind=null).

ALTER TABLE what_matters_types ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE what_matters_types ADD COLUMN IF NOT EXISTS value_kind TEXT;

ALTER TABLE case_what_matters ADD COLUMN IF NOT EXISTS amount_specific DOUBLE PRECISION;

ALTER TABLE case_what_matters ADD COLUMN IF NOT EXISTS amount_min DOUBLE PRECISION;

ALTER TABLE case_what_matters ADD COLUMN IF NOT EXISTS amount_max DOUBLE PRECISION;

ALTER TABLE case_what_matters ADD COLUMN IF NOT EXISTS term_years INTEGER;

ALTER TABLE case_what_matters ADD COLUMN IF NOT EXISTS term_months INTEGER;

CREATE TABLE IF NOT EXISTS decision_capture_fields (
  id TEXT PRIMARY KEY,
  decision_point_type_id TEXT NOT NULL REFERENCES decision_point_types(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  choice_options TEXT,
  linked_what_matters_type_id TEXT REFERENCES what_matters_types(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS case_decision_values (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL REFERENCES decision_capture_fields(id) ON DELETE CASCADE,
  value_number DOUBLE PRECISION,
  value_date TIMESTAMPTZ,
  value_years INTEGER,
  value_months INTEGER,
  value_choice TEXT,
  CONSTRAINT case_decision_values_unique UNIQUE (case_id, field_id)
);
