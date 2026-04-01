import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode, getEntries, getHandlingTypes, getDemandTypes, getContactMethods, getWhatMattersTypes } from '@/lib/queries';
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

  const [entries, hTypes, dTypes, cMethods, wmTypes, dashboard] = await Promise.all([
    getEntries(study.id, from, to),
    getHandlingTypes(study.id),
    getDemandTypes(study.id),
    getContactMethods(study.id),
    getWhatMattersTypes(study.id),
    getDashboardData(study.id, from, to),
  ]);

  const hTypeMap = new Map(hTypes.map(h => [h.id, h.label]));
  const dTypeMap = new Map(dTypes.map(d => [d.id, d.label]));
  const cMethodMap = new Map(cMethods.map(c => [c.id, c.label]));
  const wmTypeMap = new Map(wmTypes.map(w => [w.id, w.label]));

  // Sheet 1: Raw entries
  const entriesData = entries.map(e => ({
    'Date': new Date(e.createdAt).toLocaleString(),
    'Demand (Verbatim)': e.verbatim,
    'Classification': e.classification === 'value' ? 'Value' : 'Failure',
    'Demand Type': e.demandTypeId ? dTypeMap.get(e.demandTypeId) || '' : '',
    'Handling': e.handlingTypeId ? hTypeMap.get(e.handlingTypeId) || '' : '',
    'Contact Method': e.contactMethodId ? cMethodMap.get(e.contactMethodId) || '' : '',
    'What Matters Category': e.whatMattersTypeId ? wmTypeMap.get(e.whatMattersTypeId) || '' : '',
    'Original Value Demand': e.originalValueDemandTypeId ? dTypeMap.get(e.originalValueDemandTypeId) || '' : '',
    'Failure Cause (System Condition)': e.failureCause || '',
    'What Matters (Notes)': e.whatMatters || '',
  }));

  // Sheet 2: Summary
  const summaryData = [
    { 'Metric': 'Total Entries', 'Value': dashboard.totalEntries },
    { 'Metric': 'Value Demand', 'Value': dashboard.valueCount },
    { 'Metric': 'Failure Demand', 'Value': dashboard.failureCount },
    { 'Metric': 'Value %', 'Value': dashboard.totalEntries > 0 ? `${Math.round((dashboard.valueCount / dashboard.totalEntries) * 100)}%` : '0%' },
    { 'Metric': 'Failure %', 'Value': dashboard.totalEntries > 0 ? `${Math.round((dashboard.failureCount / dashboard.totalEntries) * 100)}%` : '0%' },
    { 'Metric': 'Perfect %', 'Value': `${dashboard.perfectPercentage}%` },
  ];

  const wb = XLSX.utils.book_new();
  const wsEntries = XLSX.utils.json_to_sheet(entriesData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  XLSX.utils.book_append_sheet(wb, wsEntries, 'Demand Entries');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="demand-study-${code}.xlsx"`,
    },
  });
}
