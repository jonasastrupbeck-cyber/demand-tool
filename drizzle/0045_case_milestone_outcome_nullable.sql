-- Migration 0045: relax case_milestones.outcome to NULLABLE (2026-07-03).
--
-- Phase 1 of retiring the decision layer (expand-contract). Milestone completion
-- is fully derived now (case_milestones.derived); the achieved/not_achieved
-- outcome is dead. Relaxing NOT NULL lets the completion code stop writing it
-- with ZERO deploy-ordering risk — existing rows keep their value, new derived
-- rows omit it. Additive/safe. The column itself is dropped later in 0046 once
-- nothing writes it.

ALTER TABLE case_milestones ALTER COLUMN outcome DROP NOT NULL;
