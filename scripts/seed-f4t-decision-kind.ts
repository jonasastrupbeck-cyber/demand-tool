/**
 * Backfills decision_point_types.kind='person' on the F4T flow studies so the
 * person milestone shows the Willingness/Ability-to-Pay sub-states (C9).
 * New flow studies get this automatically from DEFAULT_DECISION_POINT_TYPES;
 * this is for the five studies seeded before `kind` existed.
 *
 * Usage: node --env-file=.env.local --import tsx scripts/seed-f4t-decision-kind.ts [CODE ...]
 *
 * Targets the person decision (sort_order 0 — the default seed order) so it is
 * locale-independent. Idempotent.
 */

import { db } from '../src/lib/db';
import { studies, decisionPointTypes } from '../src/lib/schema';
import { eq, and } from 'drizzle-orm';

const DEFAULT_CODES = ['U6TFNW', 'EH478Y', '48NQ9P', 'SJAVC6', 'Q7KGAJ'];

async function main() {
  const codes = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_CODES;
  for (const code of codes) {
    const study = (await db.select().from(studies).where(eq(studies.accessCode, code.toUpperCase())))[0];
    if (!study) { console.log(`   ⚠ ${code}: not found`); continue; }
    const types = await db.select().from(decisionPointTypes).where(eq(decisionPointTypes.studyId, study.id));
    const person = types.find((t) => t.sortOrder === 0);
    if (!person) { console.log(`   ⚠ ${code}: no sort_order 0 decision type`); continue; }
    await db.update(decisionPointTypes).set({ kind: 'person' }).where(and(eq(decisionPointTypes.id, person.id)));
    console.log(`   ✅ ${code} (${study.name}): "${person.label}" → kind=person`);
  }
  console.log('\n✅ Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error('❌', e.message); process.exit(1); });
