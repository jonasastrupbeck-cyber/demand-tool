/*
 * delete-studies.cjs — hard-delete studies and ALL their dependents.
 *
 * The schema has NO `ON DELETE CASCADE`, so this deletes every child row across
 * all study-scoped tables in FK-safe order, atomically PER STUDY via
 * sql.transaction() — any error rolls that study back cleanly (no partial delete,
 * no orphans). Order derived from the live information_schema FK graph.
 *
 * USAGE (run from the demand-tool dir):
 *   # 1. get the prod connection string (paste as its own line):
 *   export PROD_DB="$(npx neonctl connection-string production --project-id curly-voice-20295099 --pooled --org-id org-gentle-credit-26332465)"
 *   # 2. DRY-RUN first — just reports what each study holds, deletes nothing:
 *   MODE=dry   DATABASE_URL="$PROD_DB" node scripts/delete-studies.cjs 7F64AM FARU56 ...
 *   # 3. once the dry-run looks right, execute:
 *   MODE=delete DATABASE_URL="$PROD_DB" node scripts/delete-studies.cjs 7F64AM FARU56 ...
 *
 * MODE defaults to 'dry' (safe). Pass access codes as args.
 */
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
const MODE = process.env.MODE || 'dry';
const codes = process.argv.slice(2);

function deletesFor(S) {
  const msSub = sql`(SELECT sq.id FROM subquestions sq JOIN milestones m ON sq.milestone_id=m.id WHERE m.study_id=${S})`;
  const entrySub = sql`(SELECT id FROM demand_entries WHERE study_id=${S})`;
  const caseSub = sql`(SELECT id FROM cases WHERE study_id=${S})`;
  const msIdSub = sql`(SELECT id FROM milestones WHERE study_id=${S})`;
  return [
    sql`DELETE FROM work_block_system_conditions WHERE work_block_id IN (SELECT b.id FROM work_description_blocks b JOIN demand_entries e ON b.demand_entry_id=e.id WHERE e.study_id=${S})`,
    sql`DELETE FROM demand_entry_thinking_scs WHERE demand_entry_id IN ${entrySub}`,
    sql`DELETE FROM demand_entry_what_matters WHERE demand_entry_id IN ${entrySub}`,
    sql`DELETE FROM demand_entry_thinkings WHERE demand_entry_id IN ${entrySub}`,
    sql`DELETE FROM demand_entry_system_conditions WHERE demand_entry_id IN ${entrySub}`,
    sql`DELETE FROM work_description_blocks WHERE demand_entry_id IN ${entrySub}`,
    sql`DELETE FROM case_subquestion_answers WHERE case_id IN ${caseSub}`,
    sql`DELETE FROM case_what_matters WHERE case_id IN ${caseSub}`,
    sql`DELETE FROM case_milestones WHERE case_id IN ${caseSub}`,
    sql`DELETE FROM case_life_problems WHERE case_id IN ${caseSub}`,
    sql`DELETE FROM case_demand_types WHERE case_id IN ${caseSub}`,
    sql`DELETE FROM subquestion_options WHERE subquestion_id IN ${msSub}`,
    sql`DELETE FROM subquestion_conditions WHERE subquestion_id IN ${msSub} OR parent_subquestion_id IN ${msSub}`,
    sql`DELETE FROM subquestion_demand_type_exclusions WHERE subquestion_id IN ${msSub}`,
    sql`DELETE FROM subquestion_demand_type_optional WHERE subquestion_id IN ${msSub}`,
    sql`DELETE FROM milestone_demand_type_conditions WHERE milestone_id IN ${msIdSub}`,
    sql`DELETE FROM milestone_demand_type_exclusions WHERE milestone_id IN ${msIdSub}`,
    sql`DELETE FROM capability_annotations WHERE study_id=${S}`,
    sql`DELETE FROM demand_entries WHERE study_id=${S}`,
    sql`DELETE FROM cases WHERE study_id=${S}`,
    sql`DELETE FROM subquestions WHERE milestone_id IN ${msIdSub}`,
    sql`DELETE FROM milestones WHERE study_id=${S}`,
    sql`DELETE FROM system_condition_merges WHERE study_id=${S}`,
    sql`DELETE FROM taxonomy_merges WHERE study_id=${S}`,
    sql`DELETE FROM demand_types WHERE study_id=${S}`,
    sql`DELETE FROM work_types WHERE study_id=${S}`,
    sql`DELETE FROM what_matters_types WHERE study_id=${S}`,
    sql`DELETE FROM system_conditions WHERE study_id=${S}`,
    sql`DELETE FROM work_step_types WHERE study_id=${S}`,
    sql`DELETE FROM value_steps WHERE study_id=${S}`,
    sql`DELETE FROM thinkings WHERE study_id=${S}`,
    sql`DELETE FROM handling_types WHERE study_id=${S}`,
    sql`DELETE FROM contact_methods WHERE study_id=${S}`,
    sql`DELETE FROM points_of_transaction WHERE study_id=${S}`,
    sql`DELETE FROM work_sources WHERE study_id=${S}`,
    sql`DELETE FROM life_problems WHERE study_id=${S}`,
    sql`DELETE FROM lifecycle_stages WHERE study_id=${S}`,
    sql`DELETE FROM study_templates WHERE source_study_id=${S}`,
    sql`DELETE FROM studies WHERE id=${S}`,
  ];
}

async function orphanCount(S) {
  const r = await sql`SELECT
      (SELECT count(*) FROM studies WHERE id=${S})
      + (SELECT count(*) FROM demand_types WHERE study_id=${S})
      + (SELECT count(*) FROM milestones WHERE study_id=${S})
      + (SELECT count(*) FROM system_conditions WHERE study_id=${S})
      + (SELECT count(*) FROM handling_types WHERE study_id=${S})
      + (SELECT count(*) FROM what_matters_types WHERE study_id=${S})
      + (SELECT count(*) FROM cases WHERE study_id=${S})
      + (SELECT count(*) FROM demand_entries WHERE study_id=${S})
      + (SELECT count(*) FROM lifecycle_stages WHERE study_id=${S})
      + (SELECT count(*) FROM value_steps WHERE study_id=${S}) AS n`;
  return Number(r[0].n);
}

(async () => {
  if (!codes.length) { console.error('Pass study access codes as args.'); process.exit(1); }
  const total0 = (await sql`SELECT count(*)::int n FROM studies`)[0].n;
  console.log(`MODE=${MODE}  total studies before: ${total0}\n`);
  for (const code of codes) {
    const rows = await sql`SELECT id, name FROM studies WHERE access_code=${code}`;
    if (!rows.length) { console.log(`${code}: NOT FOUND — skipped`); continue; }
    const S = rows[0].id;
    const pre = (await sql`SELECT
      (SELECT count(*)::int FROM demand_entries WHERE study_id=${S}) entries,
      (SELECT count(*)::int FROM cases WHERE study_id=${S}) cases,
      (SELECT count(*)::int FROM milestones WHERE study_id=${S}) milestones,
      (SELECT count(*)::int FROM study_templates WHERE source_study_id=${S}) templates_sourced`)[0];
    if (MODE === 'dry') {
      console.log(`${code} "${rows[0].name}": ${JSON.stringify(pre)}  [DRY — nothing deleted]`);
    } else {
      await sql.transaction(deletesFor(S));
      const orphans = await orphanCount(S);
      console.log(`${code} "${rows[0].name}": DELETED (was ${JSON.stringify(pre)}) — orphans left: ${orphans}`);
    }
  }
  const total1 = (await sql`SELECT count(*)::int n FROM studies`)[0].n;
  console.log(`\ntotal studies after: ${total1}  (delta ${total1 - total0})`);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
