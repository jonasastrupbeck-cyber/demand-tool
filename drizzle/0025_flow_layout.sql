-- 0025: Flow layout sub-mode (C5, 2026-06-17).
--
-- Adds studies.flow_layout to choose between the two flow layouts WITHOUT
-- touching the systemType regime:
--   'stacked' (default) — today's mobile-first vertical flow. Skipton's live
--                         field-test study stays here, unchanged.
--   'freeze'            — the wide-screen freeze-pane (frozen customer pane
--                         left, scrolling touch rail, frozen decision pane right).
-- Additive + default 'stacked' so every existing study renders exactly as before.

ALTER TABLE studies
  ADD COLUMN IF NOT EXISTS flow_layout TEXT NOT NULL DEFAULT 'stacked';
