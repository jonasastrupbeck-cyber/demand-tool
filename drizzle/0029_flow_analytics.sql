-- 0029: Flow analytics tab toggle (2026-06-24).
--
-- Flow studies get a capability-only dashboard (R7) + the Synthesise tab. This
-- adds an opt-in "Analytics" tab that surfaces the demand-style measures already
-- computed by getDashboardData (value/failure split, % perfect, touches over
-- time, capability-of-response breakdown, failure causes, helping conditions,
-- what matters, life problems) for flow studies too. Read-only; the data is
-- already aggregated from flow touches (which are demand entries). Additive,
-- default false so existing flow studies are unchanged.

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS flow_analytics_enabled BOOLEAN NOT NULL DEFAULT false;
