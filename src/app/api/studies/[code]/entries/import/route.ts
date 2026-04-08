import { NextResponse } from 'next/server';
import { getStudyByCode, getHandlingTypes, getDemandTypes, getContactMethods, getPointsOfTransaction, getWhatMattersTypes, getWorkTypes, createEntry } from '@/lib/queries';
import * as XLSX from 'xlsx';

// Map of accepted classification values → internal value
const CLASSIFICATION_MAP: Record<string, 'value' | 'failure' | 'unknown'> = {
  // English
  'value': 'value',
  'failure': 'failure',
  '?': 'unknown',
  'unknown': 'unknown',
  // Danish
  'værdiskabende': 'value',
  'ikke-værdiskabende': 'failure',
  // Danish abbreviations
  'vs': 'value',
  'ivs': 'failure',
  'spild': 'failure',
  // Swedish
  'värdeskapande': 'value',
  'icke-värdeskapande': 'failure',
  // German
  'wert': 'value',
  'fehler': 'failure',
};

const ENTRY_TYPE_MAP: Record<string, 'demand' | 'work'> = {
  'demand': 'demand',
  'work': 'work',
  // Danish
  'efterspørgsel': 'demand',
  'arbejde': 'work',
  // Swedish
  'efterfrågan': 'demand',
  'arbete': 'work',
  // German
  'nachfrage': 'demand',
  'arbeit': 'work',
};

// Convert Excel serial date number to JS Date
function excelDateToJS(serial: number): Date {
  // Excel epoch is 1900-01-01, but has a leap year bug (day 60 = Feb 29, 1900 which didn't exist)
  const utcDays = Math.floor(serial) - 25569; // 25569 = days between 1900-01-01 and 1970-01-01
  return new Date(utcDays * 86400000);
}

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
  const [hTypes, dTypes, cMethods, potTypes, wmTypes, wTypes] = await Promise.all([
    getHandlingTypes(study.id),
    getDemandTypes(study.id),
    getContactMethods(study.id),
    getPointsOfTransaction(study.id),
    getWhatMattersTypes(study.id),
    getWorkTypes(study.id),
  ]);

  const handlingMap = new Map(hTypes.map(h => [h.label.toLowerCase(), h.id]));
  const demandTypeMap = new Map(dTypes.map(d => [d.label.toLowerCase(), d.id]));
  const contactMethodMap = new Map(cMethods.map(c => [c.label.toLowerCase(), c.id]));
  const potMap = new Map(potTypes.map(p => [p.label.toLowerCase(), p.id]));
  const whatMattersTypeMap = new Map(wmTypes.map(w => [w.label.toLowerCase(), w.id]));
  const workTypeMap = new Map(wTypes.map(w => [w.label.toLowerCase(), w.id]));

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

    // Parse optional date (supports Excel serial numbers and date strings)
    let createdAt: Date | undefined;
    const rawDate = row['Date'];
    if (rawDate) {
      if (typeof rawDate === 'number' && rawDate > 1000 && rawDate < 100000) {
        // Excel serial date number
        createdAt = excelDateToJS(rawDate);
      } else {
        const parsed = new Date(String(rawDate));
        if (!isNaN(parsed.getTime())) {
          createdAt = parsed;
        }
      }
    }

    // Determine entry type
    const rawEntryType = String(row['Entry Type'] || '').trim().toLowerCase();
    const entryType = ENTRY_TYPE_MAP[rawEntryType] || 'demand';

    const demandTypeLabel = String(row['Demand Type'] || '').trim().toLowerCase();
    const workTypeLabel = String(row['Work Type'] || '').trim().toLowerCase();
    const handlingLabel = String(row['Handling'] || '').trim().toLowerCase();
    const contactMethodLabel = String(row['Contact Method'] || '').trim().toLowerCase();
    const potLabel = String(row['Point of Transaction'] || '').trim().toLowerCase();
    const whatMattersTypeLabel = String(row['What Matters Category'] || '').trim().toLowerCase();

    const demandTypeId = demandTypeLabel ? demandTypeMap.get(demandTypeLabel) : undefined;
    const workTypeId = workTypeLabel ? workTypeMap.get(workTypeLabel) : undefined;
    const handlingTypeId = handlingLabel ? handlingMap.get(handlingLabel) : undefined;
    const contactMethodId = contactMethodLabel ? contactMethodMap.get(contactMethodLabel) : undefined;
    const pointOfTransactionId = potLabel ? potMap.get(potLabel) : undefined;
    const whatMattersTypeId = whatMattersTypeLabel ? whatMattersTypeMap.get(whatMattersTypeLabel) : undefined;

    const originalValueDemandLabel = String(row['Original Value Demand'] || '').trim().toLowerCase();
    const originalValueDemandTypeId = (classification === 'failure' && originalValueDemandLabel)
      ? demandTypeMap.get(originalValueDemandLabel)
      : undefined;

    const failureCause = classification === 'failure'
      ? String(row['Failure Cause (System Condition)'] || '').trim() || undefined
      : undefined;
    const whatMatters = String(row['What Matters (Notes)'] || row['What Matters to Customer'] || '').trim() || undefined;
    const collectorName = String(row['Collector'] || '').trim() || undefined;

    await createEntry(study.id, {
      verbatim,
      classification,
      entryType,
      demandTypeId: demandTypeId || undefined,
      workTypeId: workTypeId || undefined,
      handlingTypeId: handlingTypeId || undefined,
      contactMethodId: contactMethodId || undefined,
      pointOfTransactionId: pointOfTransactionId || undefined,
      whatMattersTypeId: whatMattersTypeId || undefined,
      originalValueDemandTypeId: originalValueDemandTypeId || undefined,
      failureCause,
      whatMatters,
      collectorName,
    }, createdAt);
    imported++;
  }

  return NextResponse.json({ imported, errors });
}
