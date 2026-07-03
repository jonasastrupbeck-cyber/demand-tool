-- Migration 0043: implicit case closure (2026-07-03).
--
-- With the decision-box redesign, the FINAL milestone completing auto-closes a
-- case. closed_reason disambiguates that automatic close ('final_milestone')
-- from an explicit human close ('manual') so the recompute never fights a manual
-- close: recompute only reopens a case it closed itself. Additive + nullable
-- (existing closed cases read as NULL = treated like a manual close, never
-- auto-reopened).

ALTER TABLE cases ADD COLUMN IF NOT EXISTS closed_reason TEXT;
