-- Phase 2 item 1 (Ali's mockup): "Life Problem To Be Solved" — a study-scoped taxonomy
-- mirroring handling_types. Captured per demand entry so we can spot common life problems
-- a service is failing to enable.

CREATE TABLE IF NOT EXISTS "life_problems" (
    "id" text PRIMARY KEY NOT NULL,
    "study_id" text NOT NULL REFERENCES "studies"("id"),
    "label" text NOT NULL,
    "operational_definition" text,
    "sort_order" integer DEFAULT 0 NOT NULL
);

ALTER TABLE "demand_entries" ADD COLUMN IF NOT EXISTS "life_problem_id" text REFERENCES "life_problems"("id");
