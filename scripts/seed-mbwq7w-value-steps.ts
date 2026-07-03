/**
 * Seed the 10 mortgage value steps into study MBWQ7W and turn the feature on.
 * Idempotent (skips a label that already exists). Runnable on dev (.env.local)
 * or prod:
 *   DATABASE_URL="$PROD_DB" node --import tsx scripts/seed-mbwq7w-value-steps.ts
 */
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

const LABELS = [
  'Willingness to Pay',
  'Ability to pay',
  'Assurity of the property',
  'Value of the property',
  'Options',
  'Documentation',
  'Conveyancing',
  'CoT',
  'Move money perfectly',
  '1st Direct debit',
];

async function main() {
  const rows: any = await sql.query(`SELECT id FROM studies WHERE access_code='MBWQ7W'`);
  if (!rows.length) { console.error('Study MBWQ7W not found'); process.exit(1); }
  const studyId = rows[0].id;

  for (let i = 0; i < LABELS.length; i++) {
    await sql.query(
      `INSERT INTO value_steps (id, study_id, label, sort_order)
       SELECT gen_random_uuid()::text, $1, $2, $3
       WHERE NOT EXISTS (SELECT 1 FROM value_steps WHERE study_id=$1 AND label=$2)`,
      [studyId, LABELS[i], i],
    );
  }
  await sql.query(`UPDATE studies SET value_steps_enabled=true WHERE id=$1`, [studyId]);

  const seeded: any = await sql.query(`SELECT label, sort_order FROM value_steps WHERE study_id=$1 ORDER BY sort_order`, [studyId]);
  console.log('MBWQ7W value steps:', JSON.stringify(seeded, null, 2));
  console.log('value_steps_enabled = true');
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
