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

// Split SQL into statements on `;`, but ignore semicolons inside single-quoted
// string literals, dollar-quoted blocks ($$…$$ / $tag$…$tag$, e.g. a DO block),
// and `--` line comments. The old naive split-on-';' broke on any of those.
function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let cur = '';
  let i = 0;
  let inSingle = false;
  let dollarTag: string | null = null;
  while (i < sql.length) {
    const ch = sql[i];
    const rest = sql.slice(i);
    if (dollarTag) {
      if (rest.startsWith(dollarTag)) { cur += dollarTag; i += dollarTag.length; dollarTag = null; continue; }
      cur += ch; i++; continue;
    }
    if (inSingle) {
      cur += ch; i++;
      if (ch === "'") { if (sql[i] === "'") { cur += "'"; i++; } else inSingle = false; }
      continue;
    }
    if (ch === '-' && sql[i + 1] === '-') { const nl = sql.indexOf('\n', i); if (nl === -1) break; i = nl; continue; }
    const dq = rest.match(/^\$[A-Za-z0-9_]*\$/);
    if (dq) { dollarTag = dq[0]; cur += dq[0]; i += dq[0].length; continue; }
    if (ch === "'") { inSingle = true; cur += ch; i++; continue; }
    if (ch === ';') { if (cur.trim()) out.push(cur.trim()); cur = ''; i++; continue; }
    cur += ch; i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Usage: apply-migration.ts <path-to.sql>'); process.exit(1); }

  const raw = readFileSync(file, 'utf8');
  const statements = splitStatements(raw);

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
