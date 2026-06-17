/**
 * Seeds the five F4T (Fixed-For-Today / Decision-In-Principle) flow studies.
 * Slice 0 / C1 of the 17 Jun 2026 change list — build Help Me Stay first.
 *
 * Usage:
 *   1. Start the dev server (it loads .env.local → dev DB)
 *   2. Run: node --env-file=.env.local --import tsx scripts/seed-f4t-studies.ts
 *
 * Each study is created with systemType:'flow', so createStudy() applies
 * FLOW_PRESET_TOGGLES and seeds the default decision points, handling types
 * (COR) and demand types automatically. Idempotent: a flow study with the same
 * name is skipped (re-running won't create duplicates).
 *
 * Study-specific taxonomy (life problems, what matters, system conditions, the
 * F4T COR vocabulary) is intentionally NOT seeded here — that is consultant
 * configuration (C2) and the COR vocabulary lands in Slice 3 (C7).
 */

import { db } from '../src/lib/db';
import { studies } from '../src/lib/schema';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Owner-supplied names (change list, 17 Jun). Build order: Stay first.
const F4T_STUDIES: { name: string; description: string }[] = [
  { name: 'Help Me Stay', description: 'F4T flow study — Help Me Stay team' },
  { name: 'Help Me Leave', description: 'F4T flow study — Help Me Leave team' },
  { name: 'Help Me Pay', description: 'F4T flow study — Help Me Pay team' },
  { name: 'Purchase', description: 'F4T flow study — Purchase team' },
  { name: 'Rate Market', description: 'F4T flow study — Rate Market team' },
];

interface StudyResponse { id: string; accessCode: string; name: string; }

async function main() {
  console.log('🔧 F4T flow-study seeder');
  console.log(`   Target: ${BASE_URL}`);

  try {
    await fetch(BASE_URL);
  } catch {
    console.error(`\n❌ Cannot connect to ${BASE_URL}. Is the dev server running?`);
    process.exit(1);
  }

  const existing = await db.select({ name: studies.name, code: studies.accessCode, type: studies.systemType }).from(studies);
  const existingFlowNames = new Set(
    existing.filter(s => s.type === 'flow').map(s => s.name.toLowerCase())
  );

  const created: { name: string; code: string }[] = [];
  const skipped: { name: string; code: string }[] = [];

  for (const s of F4T_STUDIES) {
    if (existingFlowNames.has(s.name.toLowerCase())) {
      const match = existing.find(e => e.type === 'flow' && e.name.toLowerCase() === s.name.toLowerCase())!;
      skipped.push({ name: s.name, code: match.code });
      console.log(`   ⏭  "${s.name}" already exists as a flow study (${match.code}) — skipped`);
      continue;
    }
    const res = await fetch(`${BASE_URL}/api/studies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // adminSecret satisfies the C2 consultant gate when CONSULTANT_ADMIN_SECRET
      // is configured; harmless (ignored) when it isn't.
      body: JSON.stringify({ name: s.name, description: s.description, locale: 'en', systemType: 'flow', adminSecret: process.env.CONSULTANT_ADMIN_SECRET }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`POST /api/studies "${s.name}" → ${res.status}: ${text}`);
    }
    const study = (await res.json()) as StudyResponse;
    created.push({ name: s.name, code: study.accessCode });
    console.log(`   ✅ "${s.name}" created — access code ${study.accessCode}`);
  }

  console.log('\n✅ Done.');
  if (created.length) {
    console.log('\n   Created:');
    for (const c of created) console.log(`     ${c.code}  ${c.name}  →  ${BASE_URL}/study/${c.code}/capture`);
  }
  if (skipped.length) {
    console.log('\n   Already existed (flow):');
    for (const c of skipped) console.log(`     ${c.code}  ${c.name}`);
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
