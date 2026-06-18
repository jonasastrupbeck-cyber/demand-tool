-- 0027: Capability-chart annotations (2026-06-18). A case is a datapoint on the
-- capability/lead-time chart; this lets a consultant EXCLUDE a point from the
-- control-limit calculation (with a reason) or attach a NOTE — scoped to the
-- MEASURE (the fromEvent→toEvent pair), so an exclusion on one chart doesn't
-- affect another. fromEvent/toEvent are the capability API string tokens
-- (caseOpen | firstContact | caseClose | decision:<id> | milestone:<id>).
-- Additive only; cascades on case delete.

CREATE TABLE IF NOT EXISTS capability_annotations (
  id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL REFERENCES studies(id),
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  from_event TEXT NOT NULL,
  to_event TEXT NOT NULL,
  excluded BOOLEAN NOT NULL DEFAULT false,
  excluded_reason TEXT,
  note TEXT,
  CONSTRAINT capability_annotations_unique UNIQUE (case_id, from_event, to_event)
);
