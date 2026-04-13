/**
 * Seed script: creates two fully-configured Vanguard Method test studies
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. Run: npx tsx scripts/seed-test-data.ts
 *
 * Creates:
 *   - Study A: "Bank Contact Centre" (100 demand entries)
 *   - Study B: "Housing Repairs Service" (80 demand + 40 work entries)
 */

import * as XLSX from 'xlsx';
import * as bankData from './data/bank-contact-centre';
import * as housingData from './data/housing-repairs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ── API helper ──

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

// ── Type interfaces ──

interface StudyResponse {
  id: string;
  accessCode: string;
  name: string;
}

interface TypeItem {
  id: string;
  label: string;
  category?: string;
}

// ── Seed Study A: Bank Contact Centre ──

async function seedBankStudy(): Promise<string> {
  console.log('\n📋 Creating Study A: Bank Contact Centre...');

  // 1. Create study
  const study = await api<StudyResponse>('/api/studies', 'POST', {
    name: bankData.STUDY_CONFIG.name,
    description: bankData.STUDY_CONFIG.description,
    locale: bankData.STUDY_CONFIG.locale,
    primaryContactMethod: 'Phone',
  });
  const code = study.accessCode;
  console.log(`   Access code: ${code}`);

  // 2. Set purpose
  await api(`/api/studies/${code}`, 'PUT', { purpose: bankData.STUDY_CONFIG.purpose });

  // 3. Fetch default types
  const defaultDemandTypes = await api<TypeItem[]>(`/api/studies/${code}/demand-types`);
  const defaultHandlingTypes = await api<TypeItem[]>(`/api/studies/${code}/handling-types`);

  // 4. Delete default value demand types (replace with domain-specific)
  for (const dt of defaultDemandTypes) {
    await api(`/api/studies/${code}/demand-types/${dt.id}`, 'DELETE');
  }
  console.log(`   Deleted ${defaultDemandTypes.length} default demand types`);

  // 5. Delete Pass-on and Pass-back handling types (keep One Stop)
  for (const ht of defaultHandlingTypes) {
    if (ht.label !== 'One Stop') {
      await api(`/api/studies/${code}/handling-types/${ht.id}`, 'DELETE');
    }
  }

  // 6. Add domain-specific types
  for (const label of bankData.VALUE_DEMAND_TYPES) {
    await api(`/api/studies/${code}/demand-types`, 'POST', { label, category: 'value' });
  }
  for (const label of bankData.FAILURE_DEMAND_TYPES) {
    await api(`/api/studies/${code}/demand-types`, 'POST', { label, category: 'failure' });
  }
  console.log(`   Added ${bankData.VALUE_DEMAND_TYPES.length} value + ${bankData.FAILURE_DEMAND_TYPES.length} failure demand types`);

  // Add remaining handling types
  for (const label of bankData.HANDLING_TYPES) {
    if (label !== 'One Stop') {
      await api(`/api/studies/${code}/handling-types`, 'POST', { label });
    }
  }

  // Add extra contact methods
  for (const label of bankData.EXTRA_CONTACT_METHODS) {
    await api(`/api/studies/${code}/contact-methods`, 'POST', { label });
  }

  // Add points of transaction
  for (const label of bankData.POINTS_OF_TRANSACTION) {
    await api(`/api/studies/${code}/points-of-transaction`, 'POST', { label });
  }

  // Add what matters types
  for (const label of bankData.WHAT_MATTERS_TYPES) {
    await api(`/api/studies/${code}/what-matters-types`, 'POST', { label });
  }

  console.log('   All types configured');

  // 7. Activate layers 2 → 5
  for (const layer of [2, 3, 4, 5]) {
    await api(`/api/studies/${code}/activate-layer`, 'PUT', { targetLayer: layer });
  }
  console.log('   Layers activated to 5');

  // 8. Build and import XLSX
  const entries = bankData.ENTRIES.map(e => ({
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
  }));

  await importXLSX(code, entries);
  console.log(`   Imported ${entries.length} entries`);

  return code;
}

// ── Seed Study B: Housing Repairs Service ──

async function seedHousingStudy(): Promise<string> {
  console.log('\n🏠 Creating Study B: Housing Repairs Service...');

  // 1. Create study
  const study = await api<StudyResponse>('/api/studies', 'POST', {
    name: housingData.STUDY_CONFIG.name,
    description: housingData.STUDY_CONFIG.description,
    locale: housingData.STUDY_CONFIG.locale,
    primaryContactMethod: 'Phone',
  });
  const code = study.accessCode;
  console.log(`   Access code: ${code}`);

  // 2. Set purpose + enable work tracking
  await api(`/api/studies/${code}`, 'PUT', {
    purpose: housingData.STUDY_CONFIG.purpose,
    workTrackingEnabled: true,
  });

  // 3. Fetch and delete defaults
  const defaultDemandTypes = await api<TypeItem[]>(`/api/studies/${code}/demand-types`);
  const defaultHandlingTypes = await api<TypeItem[]>(`/api/studies/${code}/handling-types`);
  const defaultContactMethods = await api<TypeItem[]>(`/api/studies/${code}/contact-methods`);

  for (const dt of defaultDemandTypes) {
    await api(`/api/studies/${code}/demand-types/${dt.id}`, 'DELETE');
  }
  for (const ht of defaultHandlingTypes) {
    if (ht.label !== 'One Stop') {
      await api(`/api/studies/${code}/handling-types/${ht.id}`, 'DELETE');
    }
  }
  // Delete default contact methods (we want our own set including Online portal)
  for (const cm of defaultContactMethods) {
    await api(`/api/studies/${code}/contact-methods/${cm.id}`, 'DELETE');
  }

  // 4. Add domain-specific types
  for (const label of housingData.VALUE_DEMAND_TYPES) {
    await api(`/api/studies/${code}/demand-types`, 'POST', { label, category: 'value' });
  }
  for (const label of housingData.FAILURE_DEMAND_TYPES) {
    await api(`/api/studies/${code}/demand-types`, 'POST', { label, category: 'failure' });
  }
  console.log(`   Added ${housingData.VALUE_DEMAND_TYPES.length} value + ${housingData.FAILURE_DEMAND_TYPES.length} failure demand types`);

  for (const label of housingData.HANDLING_TYPES) {
    if (label !== 'One Stop') {
      await api(`/api/studies/${code}/handling-types`, 'POST', { label });
    }
  }

  for (const label of housingData.CONTACT_METHODS) {
    await api(`/api/studies/${code}/contact-methods`, 'POST', { label });
  }

  for (const label of housingData.POINTS_OF_TRANSACTION) {
    await api(`/api/studies/${code}/points-of-transaction`, 'POST', { label });
  }

  for (const label of housingData.WHAT_MATTERS_TYPES) {
    await api(`/api/studies/${code}/what-matters-types`, 'POST', { label });
  }

  for (const label of housingData.WORK_TYPES) {
    await api(`/api/studies/${code}/work-types`, 'POST', { label });
  }

  console.log('   All types configured (including work types)');

  // 5. Activate layers 2 → 5
  for (const layer of [2, 3, 4, 5]) {
    await api(`/api/studies/${code}/activate-layer`, 'PUT', { targetLayer: layer });
  }
  console.log('   Layers activated to 5');

  // 6. Build and import XLSX
  const entries = housingData.ENTRIES.map(e => ({
    'Date': e.date,
    'Entry Type': e.entryType,
    'Demand (Verbatim)': e.verbatim,
    'Classification': e.classification,
    'Demand Type': e.demandType || '',
    'Work Type': e.workType || '',
    'Handling': e.handling || '',
    'Contact Method': e.contactMethod || '',
    'Point of Transaction': e.pointOfTransaction || '',
    'What Matters Category': e.whatMattersCategory || '',
    'Original Value Demand': e.originalValueDemand || '',
    'Failure Cause (System Condition)': e.failureCause || '',
    'What Matters (Notes)': e.whatMattersNotes || '',
    'Collector': e.collector,
  }));

  await importXLSX(code, entries);
  console.log(`   Imported ${entries.length} entries`);

  return code;
}

// ── XLSX builder + uploader ──

async function importXLSX(code: string, rows: Record<string, string>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'seed-data.xlsx');

  const res = await fetch(`${BASE_URL}/api/studies/${code}/entries/import`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Import failed: ${res.status}: ${text}`);
  }

  const result = await res.json();
  if (result.errors && result.errors.length > 0) {
    console.warn(`   ⚠ Import warnings (${result.errors.length}):`);
    result.errors.slice(0, 5).forEach((e: { row: number; message: string }) => {
      console.warn(`     Row ${e.row}: ${e.message}`);
    });
    if (result.errors.length > 5) {
      console.warn(`     ... and ${result.errors.length - 5} more`);
    }
  }
}

// ── Main ──

async function main() {
  console.log('🔧 Vanguard Demand Tool — Test Data Seeder');
  console.log(`   Target: ${BASE_URL}`);

  // Check server is running
  try {
    await fetch(BASE_URL);
  } catch {
    console.error(`\n❌ Cannot connect to ${BASE_URL}. Is the dev server running? (npm run dev)`);
    process.exit(1);
  }

  const bankCode = await seedBankStudy();
  const housingCode = await seedHousingStudy();

  console.log('\n✅ Done! Two test studies created:\n');
  console.log(`   Study A: Bank Contact Centre`);
  console.log(`   Code: ${bankCode}`);
  console.log(`   URL: ${BASE_URL}/study/${bankCode}/dashboard\n`);
  console.log(`   Study B: Housing Repairs Service`);
  console.log(`   Code: ${housingCode}`);
  console.log(`   URL: ${BASE_URL}/study/${housingCode}/dashboard\n`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
