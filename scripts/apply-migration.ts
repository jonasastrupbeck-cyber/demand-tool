/**
 * Applies a hand-authored SQL migration file to the database that DATABASE_URL
 * points at. With .env.local that is the DEV Neon branch (never production —
 * prod is pushed manually per CLAUDE.md). Statements run one at a time because
 * neon-http does not allow multiple statements per call. Migrations use
 * CREATE/ALTER ... IF NOT EXISTS so re-running is safe.
 *
 * Usage: node --env-file=.env.local --import tsx scripts/apply-migration.ts drizzle/0026_milestones.sql
 */

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Usage: apply-migration.ts <path-to.sql>'); process.exit(1); }

  const raw = readFileSync(file, 'utf8');
  // Strip whole-line `--` comments, then split into statements on `;`.
  const cleaned = raw
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');
  const statements = cleaned.split(';').map((s) => s.trim()).filter(Boolean);

  const sql = neon(process.env.DATABASE_URL!);
  console.log(`Applying ${file} — ${statements.length} statement(s)…`);
  for (const [i, stmt] of statements.entries()) {
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 70);
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}… `);
    await sql.query(stmt);
    console.log('ok');
  }
  console.log('✅ Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error('\n❌', e.message); process.exit(1); });
