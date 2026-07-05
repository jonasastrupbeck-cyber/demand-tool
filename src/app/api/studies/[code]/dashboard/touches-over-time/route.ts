import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getTouchSeries } from '@/lib/dashboard-aggregations';

// "Touches over time": per-day touch counts by classification, bucketed on the
// effective date. Scope via ?caseId (one case), else ?p2bs (life problem), else
// all cases. Read-only. No caseId ownership check needed — getTouchSeries always
// scopes by studyId, so a foreign caseId returns zero rows.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const from = parseDateParam(sp.get('from'));
  const to = parseDateParam(sp.get('to'));
  const lifeProblemId = sp.get('p2bs') || undefined;
  const caseId = sp.get('caseId') || undefined;

  const series = await getTouchSeries(study.id, { lifeProblemId, caseId, from, to });
  return NextResponse.json(series);
}
