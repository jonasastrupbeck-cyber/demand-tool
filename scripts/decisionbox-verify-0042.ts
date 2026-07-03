/**
 * Decision-box redesign — verify the 0042 backfill (READ-ONLY).
 *
 * Run this RIGHT AFTER applying 0042 to prod, before 0043+. It confirms the
 * backfill was lossless and — critically — that NO milestone completions were
 * fabricated (so capability charts stay identical).
 *
 * Usage:
 *   DATABASE_URL="$(npx neonctl connection-string production --project-id curly-voice-20295099 --pooled)" \
 *     node --import tsx scripts/decisionbox-verify-0042.ts
 *
 * PASS criteria:
 *   - new_answers == old_values + old_decisions + willingness + ability
 *   - case_milestones total == the recon step-F baseline (unchanged)
 *   - answered_at NULLs == 0, orphan subquestions == 0
 */
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const counts: any = (await sql.query(`
    SELECT
      (SELECT count(*) FROM case_decision_values) old_values,
      (SELECT count(*) FROM case_decision_points) old_decisions,
      (SELECT count(*) FROM case_decision_points WHERE willingness_to_pay IS NOT NULL) willingness,
      (SELECT count(*) FROM case_decision_points WHERE ability_to_pay IS NOT NULL) ability,
      (SELECT count(*) FROM case_subquestion_answers) new_answers,
      (SELECT count(*) FROM case_milestones) case_milestones_total,
      (SELECT count(*) FROM case_subquestion_answers WHERE answered_at IS NULL) answered_at_nulls,
      (SELECT count(*) FROM subquestions sq LEFT JOIN milestones m ON m.id=sq.milestone_id WHERE m.id IS NULL) orphan_subquestions,
      (SELECT count(*) FROM subquestions) subquestions_total,
      (SELECT count(*) FROM subquestion_options) options_total
  `))[0];

  const expectedAnswers = Number(counts.old_values) + Number(counts.old_decisions) + Number(counts.willingness) + Number(counts.ability);
  const answersOk = Number(counts.new_answers) === expectedAnswers;

  console.log(JSON.stringify(counts, null, 2));
  console.log('\n--- checks ---');
  console.log(`answers backfill: new_answers ${counts.new_answers} === expected ${expectedAnswers}  ->  ${answersOk ? 'PASS' : 'FAIL'}`);
  console.log(`answered_at NULLs: ${counts.answered_at_nulls}  ->  ${counts.answered_at_nulls == 0 ? 'PASS' : 'FAIL'}`);
  console.log(`orphan subquestions: ${counts.orphan_subquestions}  ->  ${counts.orphan_subquestions == 0 ? 'PASS' : 'FAIL'}`);
  console.log(`\ncase_milestones total = ${counts.case_milestones_total} — MUST equal recon step-F baseline (no completions added).`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
