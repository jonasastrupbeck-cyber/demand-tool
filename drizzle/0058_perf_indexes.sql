-- 0058: secondary indexes on hot foreign-key columns (perf).
-- The schema had zero secondary indexes; every case/entry read and every
-- junction delete on save scanned the child table. These B-tree indexes cover
-- only the hot WHERE/JOIN columns that are NOT already the leading column of an
-- existing unique index — so nothing redundant is added:
--   * case_subquestion_answers / case_milestones / case_what_matters already
--     have a (case_id, …) unique; cases has (study_id, case_ref); the SC /
--     thinking / block-SC junctions lead their unique with the fk column.
-- demand_entries has no unique on case_id or study_id, the what-matters and
-- work-block junctions have no leading-fk unique, and subquestion_conditions'
-- unique leads with subquestion_id (not parent_subquestion_id).
-- All idempotent (IF NOT EXISTS) — safe to re-run.
CREATE INDEX IF NOT EXISTS idx_demand_entries_case_id ON demand_entries (case_id);
CREATE INDEX IF NOT EXISTS idx_demand_entries_study_id ON demand_entries (study_id);
CREATE INDEX IF NOT EXISTS idx_dewm_entry ON demand_entry_what_matters (demand_entry_id);
CREATE INDEX IF NOT EXISTS idx_wdb_entry ON work_description_blocks (demand_entry_id);
CREATE INDEX IF NOT EXISTS idx_sqc_parent ON subquestion_conditions (parent_subquestion_id);
