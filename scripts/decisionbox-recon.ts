/**
 * Decision-box redesign — PROD pre-flight recon (READ-ONLY).
 *
 * Run this against production BEFORE migrating, to see the live shape and catch
 * anything the dev copy didn't have (orphan decision points, decision-based
 * ASAP anchors, capability annotations on decisions). It writes nothing.
 *
 * Usage (prod connection string, NOT .env.local):
 *   DATABASE_URL="$(npx neonctl connection-string production --project-id curly-voice-20295099 --pooled)" \
 *     node --import tsx scripts/decisionbox-recon.ts
 */
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

async function q(label: string, text: string) {
  console.log(`\n=== ${label} ===`);
  try { console.log(JSON.stringify(await sql.query(text), null, 2)); }
  catch (e: any) { console.log('ERR', e.message); }
}

async function main() {
  await q('A. studies with decision data (counts to reconcile after 0042)', `
    SELECT s.access_code code,
           count(distinct dpt.id) decision_points,
           count(distinct dot.id) outcomes,
           count(distinct dcf.id) capture_fields,
           count(distinct cdp.id) case_decisions,
           count(distinct cdv.id) case_values
    FROM studies s
    LEFT JOIN decision_point_types dpt ON dpt.study_id=s.id
    LEFT JOIN decision_outcome_types dot ON dot.decision_point_type_id=dpt.id
    LEFT JOIN decision_capture_fields dcf ON dcf.decision_point_type_id=dpt.id
    LEFT JOIN case_decision_points cdp ON cdp.decision_point_type_id=dpt.id
    LEFT JOIN case_decision_values cdv ON cdv.field_id=dcf.id
    GROUP BY s.access_code HAVING count(distinct dpt.id) > 0 ORDER BY s.access_code`);

  await q('B. ORPHAN decision points (milestone_id NULL) — get a synthetic milestone', `
    SELECT s.access_code code, dpt.id, dpt.label
    FROM decision_point_types dpt JOIN studies s ON s.id=dpt.study_id
    WHERE dpt.milestone_id IS NULL`);

  await q('C. ASAP anchors pointing at a DECISION (0044 re-points to its milestone)', `
    SELECT wmt.id, s.access_code code, wmt.label, wmt.anchor_event
    FROM what_matters_types wmt JOIN studies s ON s.id=wmt.study_id
    WHERE wmt.anchor_event LIKE 'decision:%'`);

  await q('D. capability annotations on DECISION tokens (0044 re-points; dedupes collisions)', `
    SELECT id, case_id, from_event, to_event FROM capability_annotations
    WHERE from_event LIKE 'decision:%' OR to_event LIKE 'decision:%'`);

  await q('E. person willingness/ability populated (become Yes/No answers)', `
    SELECT count(*) FILTER (WHERE willingness_to_pay IS NOT NULL) willingness_rows,
           count(*) FILTER (WHERE ability_to_pay IS NOT NULL) ability_rows
    FROM case_decision_points`);

  await q('F. case_milestones baseline (MUST be unchanged after 0042 — no completions added)', `
    SELECT count(*) total FROM case_milestones`);

  await q('G. choice capture fields with CSV options (become option rows)', `
    SELECT count(*) csv_choice_fields FROM decision_capture_fields
    WHERE kind='choice' AND choice_options IS NOT NULL AND trim(choice_options) <> ''`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
