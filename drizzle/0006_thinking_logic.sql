-- Phase 2 / Item 2 — capture per-entry "logic" (free-text reasoning) on each
-- Thinking applied to a demand entry. Default '' so existing rows survive the
-- NOT NULL constraint. Unique(demandEntryId, thinkingId) prevents duplicate
-- pairs (today the UI prevents duplicates but the DB does not).
ALTER TABLE "demand_entry_thinkings" ADD COLUMN "logic" text NOT NULL DEFAULT '';
ALTER TABLE "demand_entry_thinkings" ADD CONSTRAINT "demand_entry_thinkings_demand_entry_id_thinking_id_unique" UNIQUE ("demand_entry_id", "thinking_id");
