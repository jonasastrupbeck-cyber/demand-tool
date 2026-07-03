-- Migration 0044: re-point capability/ASAP event tokens off the retiring
-- decision layer (2026-07-03).
--
-- The decision-box redesign flattens decision points into milestone
-- subquestions, so the 'decision:<typeId>' event token disappears. Anything that
-- pointed at a decision is re-pointed to that decision's milestone
-- ('milestone:<milestoneId>'). Runs BEFORE the decision tables are dropped
-- (slice 5), while decision_point_types still resolves the mapping. Idempotent
-- (only rows still on the decision: prefix are touched; unmappable rows — a
-- decision with no milestone — are left as-is rather than broken).

-- what_matters_types.anchor_event (ASAP measurement anchor).
UPDATE what_matters_types wmt
SET anchor_event = 'milestone:'||(SELECT dpt.milestone_id FROM decision_point_types dpt WHERE dpt.id = replace(wmt.anchor_event, 'decision:', ''))
WHERE wmt.anchor_event LIKE 'decision:%'
  AND (SELECT dpt.milestone_id FROM decision_point_types dpt WHERE dpt.id = replace(wmt.anchor_event, 'decision:', '')) IS NOT NULL;

-- capability_annotations.from_event — drop rows that would collide with an
-- existing milestone-token row for the same (case, to_event), then re-point.
DELETE FROM capability_annotations a
WHERE a.from_event LIKE 'decision:%'
  AND EXISTS (
    SELECT 1 FROM capability_annotations b
    WHERE b.case_id = a.case_id AND b.to_event = a.to_event
      AND b.from_event = 'milestone:'||(SELECT dpt.milestone_id FROM decision_point_types dpt WHERE dpt.id = replace(a.from_event, 'decision:', ''))
  );

UPDATE capability_annotations a
SET from_event = 'milestone:'||(SELECT dpt.milestone_id FROM decision_point_types dpt WHERE dpt.id = replace(a.from_event, 'decision:', ''))
WHERE a.from_event LIKE 'decision:%'
  AND (SELECT dpt.milestone_id FROM decision_point_types dpt WHERE dpt.id = replace(a.from_event, 'decision:', '')) IS NOT NULL;

-- capability_annotations.to_event — same dedupe + re-point.
DELETE FROM capability_annotations a
WHERE a.to_event LIKE 'decision:%'
  AND EXISTS (
    SELECT 1 FROM capability_annotations b
    WHERE b.case_id = a.case_id AND b.from_event = a.from_event
      AND b.to_event = 'milestone:'||(SELECT dpt.milestone_id FROM decision_point_types dpt WHERE dpt.id = replace(a.to_event, 'decision:', ''))
  );

UPDATE capability_annotations a
SET to_event = 'milestone:'||(SELECT dpt.milestone_id FROM decision_point_types dpt WHERE dpt.id = replace(a.to_event, 'decision:', ''))
WHERE a.to_event LIKE 'decision:%'
  AND (SELECT dpt.milestone_id FROM decision_point_types dpt WHERE dpt.id = replace(a.to_event, 'decision:', '')) IS NOT NULL;
