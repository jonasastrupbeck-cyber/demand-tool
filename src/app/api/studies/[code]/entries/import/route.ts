import { NextResponse } from 'next/server';
import { getStudyByCode, getHandlingTypes, getDemandTypes, getContactMethods, getWhatMattersTypes, createEntry } from '@/lib/queries';
import * as XLSX from 'xlsx';

// Map of accepted classification values → internal value
const CLASSIFICATION_MAP: Record<string, 'value' | 'failure'> = {
  // English
  'value': 'value',
  'failure': 'failure',
  // Danish
  'værdiskabende': 'value',
  'ikke-værdiskabende': 'failure',
  // Swedish
  'värdeskapande': 'value',
  'icke-värdeskapande': 'failure',
  // German
  'wert': 'value',
  'fehler': 'failure',
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];

  if (!sheet) {
    return NextResponse.json({ error: 'Empty spreadsheet' }, { status: 400 });
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data rows found' }, { status: 400 });
  }

  // Build lookup maps for types (label → id, case-insensitive)
  const [hTypes, dTypes, cMethods, wmTypes] = await Promise.all([
    getHandlingTypes(study.id),
    getDemandTypes(study.id),
    getContactMethods(study.id),
    getWhatMattersTypes(study.id),
  ]);

  const handlingMap = new Map(hTypes.map(h => [h.label.toLowerCase(), h.id]));
  const demandTypeMap = new Map(dTypes.map(d => [d.label.toLowerCase(), d.id]));
  const contactMethodMap = new Map(cMethods.map(c => [c.label.toLowerCase(), c.id]));
  const whatMattersTypeMap = new Map(wmTypes.map(w => [w.label.toLowerCase(), w.id]));

  const errors: Array<{ row: number; message: string }> = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header row

    const verbatim = String(row['Demand (Verbatim)'] || '').trim();
    if (!verbatim) {
      errors.push({ row: rowNum, message: 'Missing verbatim demand' });
      continue;
    }

    const rawClassification = String(row['Classification'] || '').trim().toLowerCase();
    const classification = CLASSIFICATION_MAP[rawClassification];
    if (!classification) {
      errors.push({ row: rowNum, message: `Invalid classification: "${row['Classification'] || ''}"` });
      continue;
    }

    // Parse optional date
    let createdAt: Date | undefined;
    const rawDate = row['Date'];
    if (rawDate) {
      const parsed = new Date(String(rawDate));
      if (!isNaN(parsed.getTime())) {
        createdAt = parsed;
      }
    }

    const demandTypeLabel = String(row['Demand Type'] || '').trim().toLowerCase();
    const handlingLabel = String(row['Handling'] || '').trim().toLowerCase();
    const contactMethodLabel = String(row['Contact Method'] || '').trim().toLowerCase();
    const whatMattersTypeLabel = String(row['What Matters Category'] || '').trim().toLowerCase();

    const demandTypeId = demandTypeLabel ? demandTypeMap.get(demandTypeLabel) : undefined;
    const handlingTypeId = handlingLabel ? handlingMap.get(handlingLabel) : undefined;
    const contactMethodId = contactMethodLabel ? contactMethodMap.get(contactMethodLabel) : undefined;
    const whatMattersTypeId = whatMattersTypeLabel ? whatMattersTypeMap.get(whatMattersTypeLabel) : undefined;

    const originalValueDemandLabel = String(row['Original Value Demand'] || '').trim().toLowerCase();
    const originalValueDemandTypeId = (classification === 'failure' && originalValueDemandLabel)
      ? demandTypeMap.get(originalValueDemandLabel)
      : undefined;

    const failureCause = classification === 'failure'
      ? String(row['Failure Cause (System Condition)'] || '').trim() || undefined
      : undefined;
    const whatMatters = String(row['What Matters (Notes)'] || row['What Matters to Customer'] || '').trim() || undefined;

    await createEntry(study.id, {
      verbatim,
      classification,
      demandTypeId: demandTypeId || undefined,
      handlingTypeId: handlingTypeId || undefined,
      contactMethodId: contactMethodId || undefined,
      whatMattersTypeId: whatMattersTypeId || undefined,
      originalValueDemandTypeId: originalValueDemandTypeId || undefined,
      failureCause,
      whatMatters,
    }, createdAt);
    imported++;
  }

  return NextResponse.json({ imported, errors });
}
