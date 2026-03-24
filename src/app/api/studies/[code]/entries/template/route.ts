import { NextResponse } from 'next/server';
import { getStudyByCode, getHandlingTypes, getDemandTypes, getContactMethods, getWhatMattersTypes } from '@/lib/queries';
import * as XLSX from 'xlsx';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const [hTypes, dTypes, cMethods, wmTypes] = await Promise.all([
    getHandlingTypes(study.id),
    getDemandTypes(study.id),
    getContactMethods(study.id),
    getWhatMattersTypes(study.id),
  ]);

  const valueTypes = dTypes.filter(d => d.category === 'value');
  const failureTypes = dTypes.filter(d => d.category === 'failure');

  const templateData = [
    {
      'Date': '2025-01-15',
      'Demand (Verbatim)': 'I need to check my account balance',
      'Classification': 'Value',
      'Demand Type': valueTypes[0]?.label || '',
      'Handling': hTypes[0]?.label || '',
      'Contact Method': cMethods[0]?.label || '',
      'What Matters Category': wmTypes[0]?.label || '',
      'Failure Cause (System Condition)': '',
      'What Matters (Notes)': 'Quick answer',
    },
  ];

  const maxRows = Math.max(hTypes.length, valueTypes.length, failureTypes.length, cMethods.length, wmTypes.length, 1);
  const referenceData = [];
  for (let i = 0; i < maxRows; i++) {
    referenceData.push({
      'Handling Types': hTypes[i]?.label || '',
      'Contact Methods': cMethods[i]?.label || '',
      'Value Demand Types': valueTypes[i]?.label || '',
      'Failure Demand Types': failureTypes[i]?.label || '',
      'What Matters Types': wmTypes[i]?.label || '',
    });
  }

  const wb = XLSX.utils.book_new();
  const wsTemplate = XLSX.utils.json_to_sheet(templateData);
  const wsReference = XLSX.utils.json_to_sheet(referenceData);

  wsTemplate['!cols'] = [
    { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 35 }, { wch: 30 },
  ];
  wsReference['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template');
  XLSX.utils.book_append_sheet(wb, wsReference, 'Reference');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="demand-template-${code}.xlsx"`,
    },
  });
}
