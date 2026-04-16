/**
 * Seeds the "Citizen Support Service (test)" study.
 *
 * Usage:
 *   1. Start the dev server (npm run dev)
 *   2. Run: npx tsx scripts/seed-citizen-support.ts
 *
 * What this creates (in one study):
 *   - 100 demand entries with realistic logical coherence (life-problem →
 *     demand type → classification → handling → SC → thinking chain)
 *   - Life Problems taxonomy (10 citizen-phrased items from Stoke Top 20)
 *   - System Conditions with Helps/Hinders dimensions (customer lens)
 *   - Thinkings with per-entry logic
 *   - Lifecycle stages assigned to demand types (so the Sankey renders)
 *   - Full taxonomy: handling, contact methods, PoT, what matters, work types
 *
 * The only thing NOT exercised: Work entries + work-description blocks
 * (those are pending the "flow section" rework per Ali feedback).
 */

import * as XLSX from 'xlsx';
import * as data from './data/citizen-support';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function api<T = unknown>(path: string, method: string = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

interface StudyResponse { id: string; accessCode: string; name: string; }
interface TypeItem { id: string; label: string; category?: string; }

async function main() {
  console.log('🔧 Citizen Support Service — Test Study Seeder');
  console.log(`   Target: ${BASE_URL}`);

  try {
    await fetch(BASE_URL);
  } catch {
    console.error(`\n❌ Cannot connect to ${BASE_URL}. Is the dev server running?`);
    process.exit(1);
  }

  // 1. Create study
  console.log('\n📋 Creating study...');
  const study = await api<StudyResponse>('/api/studies', 'POST', {
    name: data.STUDY_CONFIG.name,
    description: data.STUDY_CONFIG.description,
    locale: data.STUDY_CONFIG.locale,
    primaryContactMethod: 'Phone',
  });
  const code = study.accessCode;
  console.log(`   Access code: ${code}`);

  // 2. Set purpose + enable the capture toggles we need (classification, handling,
  //    value-linking, system conditions, lifecycle). The legacy "activate-layer"
  //    endpoint was replaced by these boolean flags.
  await api(`/api/studies/${code}`, 'PUT', {
    purpose: data.STUDY_CONFIG.purpose,
    systemConditionsEnabled: true,
    lifecycleEnabled: true,
    classificationEnabled: true,
    handlingEnabled: true,
    valueLinkingEnabled: true,
  });

  // 3. Clear defaults (we want our own taxonomy)
  const defaultDemandTypes = await api<TypeItem[]>(`/api/studies/${code}/demand-types`);
  const defaultHandlingTypes = await api<TypeItem[]>(`/api/studies/${code}/handling-types`);

  for (const dt of defaultDemandTypes) {
    await api(`/api/studies/${code}/demand-types/${dt.id}`, 'DELETE');
  }
  for (const ht of defaultHandlingTypes) {
    if (ht.label !== 'One Stop') {
      await api(`/api/studies/${code}/handling-types/${ht.id}`, 'DELETE');
    }
  }
  console.log(`   Cleared ${defaultDemandTypes.length} default demand types`);

  // 4. Lifecycle stages (must come before demand types so we can assign stages to them)
  const stageIds: Record<string, string> = {};
  for (const stageLabel of data.LIFECYCLE_STAGES) {
    const s = await api<{ id: string }>(`/api/studies/${code}/lifecycle-stages`, 'POST', { label: stageLabel });
    stageIds[stageLabel] = s.id;
  }
  console.log(`   Added ${data.LIFECYCLE_STAGES.length} lifecycle stages`);

  // 5. Value + failure demand types, each assigned to a lifecycle stage
  for (const v of data.VALUE_DEMAND_TYPES) {
    const dt = await api<{ id: string }>(`/api/studies/${code}/demand-types`, 'POST', { label: v.label, category: 'value' });
    await api(`/api/studies/${code}/demand-types/${dt.id}`, 'PATCH', { lifecycleStageId: stageIds[v.stage] });
  }
  for (const f of data.FAILURE_DEMAND_TYPES) {
    const dt = await api<{ id: string }>(`/api/studies/${code}/demand-types`, 'POST', { label: f.label, category: 'failure' });
    await api(`/api/studies/${code}/demand-types/${dt.id}`, 'PATCH', { lifecycleStageId: stageIds[f.stage] });
  }
  console.log(`   Added ${data.VALUE_DEMAND_TYPES.length} value + ${data.FAILURE_DEMAND_TYPES.length} failure demand types (with lifecycle stages)`);

  // 6. Handling types (One Stop kept from defaults)
  for (const label of data.HANDLING_TYPES) {
    if (label !== 'One Stop') {
      await api(`/api/studies/${code}/handling-types`, 'POST', { label });
    }
  }

  // 7. Extra contact methods (defaults Phone/Mail/Face2face already exist)
  for (const label of data.EXTRA_CONTACT_METHODS) {
    await api(`/api/studies/${code}/contact-methods`, 'POST', { label });
  }

  // 8. Points of transaction
  for (const label of data.POINTS_OF_TRANSACTION) {
    await api(`/api/studies/${code}/points-of-transaction`, 'POST', { label });
  }

  // 9. What matters types
  for (const label of data.WHAT_MATTERS_TYPES) {
    await api(`/api/studies/${code}/what-matters-types`, 'POST', { label });
  }

  // 10. Life problems
  for (const label of data.LIFE_PROBLEMS) {
    await api(`/api/studies/${code}/life-problems`, 'POST', { label });
  }
  console.log(`   Added ${data.LIFE_PROBLEMS.length} life problems`);

  // 11. System conditions
  for (const label of data.SYSTEM_CONDITIONS) {
    await api(`/api/studies/${code}/system-conditions`, 'POST', { label });
  }
  console.log(`   Added ${data.SYSTEM_CONDITIONS.length} system conditions`);

  // 12. Thinkings
  for (const label of data.THINKINGS) {
    await api(`/api/studies/${code}/thinkings`, 'POST', { label });
  }
  console.log(`   Added ${data.THINKINGS.length} thinkings`);

  console.log('   All types configured');

  // 13. Build XLSX with all 18 columns (including the Phase 2/3 ones)
  const rows = data.ENTRIES.map(e => ({
    'Date': e.date,
    'Entry Type': e.entryType,
    'Demand (Verbatim)': e.verbatim,
    'Classification': e.classification,
    'Demand Type': e.demandType || '',
    'Work Type': '',
    'Handling': e.handling || '',
    'Contact Method': e.contactMethod || '',
    'Point of Transaction': e.pointOfTransaction || '',
    'What Matters Category': e.whatMattersCategory || '',
    'Original Value Demand': e.originalValueDemand || '',
    'Failure Cause (System Condition)': e.failureCause || '',
    'What Matters (Notes)': e.whatMattersNotes || '',
    'Collector': e.collector,
    'Life Problem': e.lifeProblem,
    'System Conditions (Hinders)': e.scHinders,
    'System Conditions (Helps)': e.scHelps,
    'Thinkings': e.thinkings,
  }));

  // 15. Upload via import endpoint
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  const formData = new FormData();
  formData.append('file', new Blob([buffer]), 'citizen-support.xlsx');

  const res = await fetch(`${BASE_URL}/api/studies/${code}/entries/import`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Import failed: ${res.status}: ${text}`);
  }
  const result = await res.json() as { imported: number; errors?: Array<{ row: number; message: string }> };

  console.log(`\n   Imported ${result.imported} entries`);
  if (result.errors && result.errors.length > 0) {
    console.warn(`   ⚠ ${result.errors.length} warnings:`);
    result.errors.slice(0, 10).forEach(e => console.warn(`     Row ${e.row}: ${e.message}`));
  }

  console.log('\n✅ Done!\n');
  console.log(`   Study: ${data.STUDY_CONFIG.name}`);
  console.log(`   Code: ${code}`);
  console.log(`   URL: ${BASE_URL}/study/${code}/dashboard\n`);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
