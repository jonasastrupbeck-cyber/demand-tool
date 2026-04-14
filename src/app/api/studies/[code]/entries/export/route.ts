import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode, getEntries, getHandlingTypes, getDemandTypes, getContactMethods, getPointsOfTransaction, getWhatMattersTypes, getWorkTypes, getWhatMattersForEntries } from '@/lib/queries';
import { getDashboardData } from '@/lib/dashboard-aggregations';
import * as XLSX from 'xlsx';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

  // Derive effective layer from the new capture toggles so exports stay in sync
  // with what the team chose to capture. Legacy activeLayer is a fallback.
  let activeLayer = 1;
  if (study.classificationEnabled) activeLayer = 2;
  if (study.handlingEnabled) activeLayer = Math.max(activeLayer, 3);
  if (study.valueLinkingEnabled) activeLayer = Math.max(activeLayer, 4);
  if (activeLayer === 1) activeLayer = study.activeLayer ?? 5;

  // Only fetch lookup data needed for the active layer
  const fetches: Promise<unknown>[] = [
    getEntries(study.id, from, to),
    getDashboardData(study.id, from, to),
    getWhatMattersTypes(study.id),
    getWorkTypes(study.id),
  ];
  // Layer 2+: demand types
  if (activeLayer >= 2) fetches.push(getDemandTypes(study.id));
  // Layer 3+: handling, contact, point of transaction
  if (activeLayer >= 3) {
    fetches.push(getHandlingTypes(study.id));
    fetches.push(getContactMethods(study.id));
    fetches.push(getPointsOfTransaction(study.id));
  }

  const results = await Promise.all(fetches);
  const entries = results[0] as Awaited<ReturnType<typeof getEntries>>;
  const dashboard = results[1] as Awaited<ReturnType<typeof getDashboardData>>;
  const wmTypes = results[2] as Awaited<ReturnType<typeof getWhatMattersTypes>>;
  const wTypes = results[3] as Awaited<ReturnType<typeof getWorkTypes>>;
  const dTypes = activeLayer >= 2 ? results[4] as Awaited<ReturnType<typeof getDemandTypes>> : [];
  const hTypes = activeLayer >= 3 ? results[5] as Awaited<ReturnType<typeof getHandlingTypes>> : [];
  const cMethods = activeLayer >= 3 ? results[6] as Awaited<ReturnType<typeof getContactMethods>> : [];
  const potTypes = activeLayer >= 3 ? results[7] as Awaited<ReturnType<typeof getPointsOfTransaction>> : [];

  // Build what-matters junction lookup
  const entryIds = entries.map(e => e.id);
  const wmJunctions = entryIds.length > 0 ? await getWhatMattersForEntries(entryIds) : [];
  const wmByEntry = new Map<string, string[]>();
  for (const j of wmJunctions) {
    const existing = wmByEntry.get(j.demandEntryId) || [];
    existing.push(j.whatMattersTypeId);
    wmByEntry.set(j.demandEntryId, existing);
  }

  // Build linked value demand verbatim lookup
  const linkedEntryIds = entries.filter(e => e.linkedValueDemandEntryId).map(e => e.linkedValueDemandEntryId!);
  const linkedVerbatimMap = new Map<string, string>();
  if (linkedEntryIds.length > 0) {
    for (const entry of entries) {
      if (linkedEntryIds.includes(entry.id)) {
        linkedVerbatimMap.set(entry.id, entry.verbatim);
      }
    }
  }

  const hTypeMap = new Map(hTypes.map(h => [h.id, h.label]));
  const dTypeMap = new Map(dTypes.map(d => [d.id, d.label]));
  const cMethodMap = new Map(cMethods.map(c => [c.id, c.label]));
  const potMap = new Map(potTypes.map(p => [p.id, p.label]));
  const wmTypeMap = new Map(wmTypes.map(w => [w.id, w.label]));
  const wTypeMap = new Map(wTypes.map(w => [w.id, w.label]));

  // Sheet 1: Raw entries (columns gated by activeLayer)
  const entriesData = entries.map(e => {
    const wmIds = wmByEntry.get(e.id) || [];
    const wmLabels = wmIds.map(id => wmTypeMap.get(id) || '').filter(Boolean).join(', ');
    const whatMattersLabel = wmLabels || (e.whatMattersTypeId ? wmTypeMap.get(e.whatMattersTypeId) || '' : '');

    const row: Record<string, string | number> = {
      'Date': new Date(e.createdAt).toLocaleString(),
      'Entry Type': e.entryType === 'work' ? 'Work' : 'Demand',
      'Demand (Verbatim)': e.verbatim,
    };

    if (activeLayer >= 2) {
      row['Classification'] = e.classification === 'value' ? 'Value' : e.classification === 'failure' ? 'Failure' : '?';
      row['Demand Type'] = e.demandTypeId ? dTypeMap.get(e.demandTypeId) || '' : '';
      row['Work Type'] = e.workTypeId ? wTypeMap.get(e.workTypeId) || '' : '';
      row['Failure Cause (System Condition)'] = e.failureCause || '';
      row['Original Value Demand'] = e.originalValueDemandTypeId ? dTypeMap.get(e.originalValueDemandTypeId) || '' : '';
      row['Linked Value Demand'] = e.linkedValueDemandEntryId ? linkedVerbatimMap.get(e.linkedValueDemandEntryId) || '' : '';
    }

    if (activeLayer >= 3) {
      row['Handling'] = e.handlingTypeId ? hTypeMap.get(e.handlingTypeId) || '' : '';
      row['Contact Method'] = e.contactMethodId ? cMethodMap.get(e.contactMethodId) || '' : '';
      row['Point of Transaction'] = e.pointOfTransactionId ? potMap.get(e.pointOfTransactionId) || '' : '';
    }

    row['What Matters Categories'] = whatMattersLabel;
    row['What Matters (Notes)'] = e.whatMatters || '';
    row['Collector'] = e.collectorName || '';

    return row;
  });

  // Sheet 2: Summary (metrics gated by activeLayer)
  const summaryData: Array<{ Metric: string; Value: string | number }> = [
    { Metric: 'Total Entries', Value: dashboard.totalEntries },
  ];
  if (activeLayer >= 2) {
    summaryData.push(
      { Metric: 'Value Demand', Value: dashboard.valueCount },
      { Metric: 'Failure Demand', Value: dashboard.failureCount },
      { Metric: 'Value %', Value: dashboard.totalEntries > 0 ? `${Math.round((dashboard.valueCount / dashboard.totalEntries) * 100)}%` : '0%' },
      { Metric: 'Failure %', Value: dashboard.totalEntries > 0 ? `${Math.round((dashboard.failureCount / dashboard.totalEntries) * 100)}%` : '0%' },
    );
  }
  if (activeLayer >= 3) {
    summaryData.push(
      { Metric: 'Perfect %', Value: `${dashboard.perfectPercentage}%` },
    );
  }

  const wb = XLSX.utils.book_new();
  const wsEntries = XLSX.utils.json_to_sheet(entriesData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  XLSX.utils.book_append_sheet(wb, wsEntries, 'Demand Entries');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Failure Flow cross-tabulation sheet (layer 2+)
  if (activeLayer >= 2 && dashboard.failureFlowLinks && dashboard.failureFlowLinks.length > 0) {
    const links = dashboard.failureFlowLinks;
    const sourceLabels = [...new Set(links.map(l => l.sourceLabel))];
    const targetLabels = [...new Set(links.map(l => l.targetLabel))];
    const countMap = new Map<string, number>();
    for (const link of links) {
      countMap.set(`${link.sourceLabel}||${link.targetLabel}`, link.count);
    }

    const aoa: (string | number)[][] = [];
    // Header row
    aoa.push(['', ...targetLabels, 'Total']);
    // Data rows
    for (const source of sourceLabels) {
      let rowTotal = 0;
      const row: (string | number)[] = [source];
      for (const target of targetLabels) {
        const count = countMap.get(`${source}||${target}`) || 0;
        rowTotal += count;
        row.push(count || '');
      }
      row.push(rowTotal);
      aoa.push(row);
    }
    // Totals row
    let grandTotal = 0;
    const totalsRow: (string | number)[] = ['Total'];
    for (const target of targetLabels) {
      const colTotal = sourceLabels.reduce((sum, source) => sum + (countMap.get(`${source}||${target}`) || 0), 0);
      grandTotal += colTotal;
      totalsRow.push(colTotal);
    }
    totalsRow.push(grandTotal);
    aoa.push(totalsRow);

    const wsFlow = XLSX.utils.aoa_to_sheet(aoa);
    wsFlow['!cols'] = [{ wch: 30 }, ...targetLabels.map(() => ({ wch: 25 })), { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, wsFlow, 'Failure Flow');
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="demand-study-${code}.xlsx"`,
    },
  });
}
