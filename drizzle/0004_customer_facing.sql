-- Phase 1 (Ali's mockup): mark each point of transaction as customer-facing or not.
-- Used downstream in dashboards/filtering; settings page exposes a tickbox per row.

ALTER TABLE "points_of_transaction" ADD COLUMN IF NOT EXISTS "customer_facing" boolean DEFAULT false NOT NULL;
