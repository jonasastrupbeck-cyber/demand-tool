-- Generic chart annotations (2026-07-09)
-- Note + exclude-from-limits per point, for the touches-per-case, steps-per-case
-- (work-block) and over-time-explorer XmR charts. Generic so it also covers the
-- day-keyed over-time chart (point_key = a date string, no case). The lead-time
-- CapabilityChart keeps its own case-scoped capability_annotations table.
-- Additive only.

CREATE TABLE IF NOT EXISTS chart_annotations (
  id text PRIMARY KEY,
  study_id text NOT NULL REFERENCES studies(id),
  chart_key text NOT NULL,
  point_key text NOT NULL,
  excluded boolean NOT NULL DEFAULT false,
  excluded_reason text,
  note text,
  CONSTRAINT chart_annotations_unique UNIQUE (study_id, chart_key, point_key)
);

CREATE INDEX IF NOT EXISTS idx_chart_annotations_lookup ON chart_annotations (study_id, chart_key);
