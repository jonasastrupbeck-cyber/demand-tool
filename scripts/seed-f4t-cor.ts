/**
 * Seeds the F4T Capability-of-Response vocabulary into the flow studies.
 * Slice 3 / C7 of the 17 Jun 2026 change list.
 *
 * Usage:
 *   node --env-file=.env.local --import tsx scripts/seed-f4t-cor.ts [CODE ...]
 *   (defaults to all five F4T studies if no codes are given)
 *
 * For each target study this REPLACES the default handling types with the five
 * owner-supplied COR types, sets customer_facing (only Done & Dusted and
 * Push-back Customer are customer-facing), and points oneStopHandlingType at
 * "Done & Dusted" (the one-stop / Perfect metric). Skips any study that already
 * has captured entries (so we never orphan a referenced COR).
 */

import { db } from '../src/lib/db';
import { studies, handlingTypes, demandEntries } from '../src/lib/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '../src/lib/utils';

// Owner-supplied COR vocabulary + descriptions (Jonas, 17 Jun 2026).
const F4T_COR: { label: string; customerFacing: boolean; oneStop?: boolean; def: string }[] = [
  { label: 'Done & Dusted',                customerFacing: true,  oneStop: true, def: 'One-stop (the Perfect metric). No further work needed for customer, Sols, or Skipton.' },
  { label: 'Pass-on to another team',      customerFacing: false,                def: 'Completed our part, sent to another team to do theirs.' },
  { label: 'Push-back Sols',               customerFacing: false,                def: 'Sols have more work to do.' },
  { label: 'Push-back Customer',           customerFacing: true,                 def: 'Customer has more work to do.' },
  { label: 'Push-back Help me Leave Team', customerFacing: false,                def: 'Skipton have more work to do.' },
];

const DEFAULT_CODES = ['U6TFNW', 'EH478Y', '48NQ9P', 'SJAVC6', 'Q7KGAJ']; // Stay, Leave, Pay, Purchase, Rate Market

async function seedStudy(code: string) {
  const study = (await db.select().from(studies).where(eq(studies.accessCode, code.toUpperCase())))[0];
  if (!study) { console.log(`   ⚠ ${code}: study not found — skipped`); return; }

  const entryCount = (await db.select({ id: demandEntries.id }).from(demandEntries).where(eq(demandEntries.studyId, study.id))).length;
  if (entryCount > 0) { console.log(`   ⚠ ${code} (${study.name}): has ${entryCount} entries — skipped to avoid orphaning a referenced COR`); return; }

  // Clear oneStop pointer first, then replace the handling types.
  await db.update(studies).set({ oneStopHandlingType: null }).where(eq(studies.id, study.id));
  await db.delete(handlingTypes).where(eq(handlingTypes.studyId, study.id));

  let oneStopId: string | null = null;
  for (let i = 0; i < F4T_COR.length; i++) {
    const c = F4T_COR[i];
    const id = generateId();
    await db.insert(handlingTypes).values({
      id,
      studyId: study.id,
      label: c.label,
      operationalDefinition: c.def,
      customerFacing: c.customerFacing,
      sortOrder: i,
    });
    if (c.oneStop) oneStopId = id;
  }
  if (oneStopId) await db.update(studies).set({ oneStopHandlingType: oneStopId }).where(eq(studies.id, study.id));
  console.log(`   ✅ ${code} (${study.name}): seeded ${F4T_COR.length} COR types; one-stop = Done & Dusted`);
}

async function main() {
  const codes = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_CODES;
  console.log(`🔧 F4T COR seeder — ${codes.length} study(ies)`);
  for (const code of codes) await seedStudy(code);
  console.log('\n✅ Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error('❌', e.message); process.exit(1); });
