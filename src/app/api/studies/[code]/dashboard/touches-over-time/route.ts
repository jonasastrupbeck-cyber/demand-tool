import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
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
  const from = sp.get('from') ? new Date(sp.get('from')!) : undefined;
  const to = sp.get('to') ? new Date(sp.get('to')!) : undefined;
  const lifeProblemId = sp.get('p2bs') || undefined;
  const caseId = sp.get('caseId') || undefined;

  const series = await getTouchSeries(study.id, { lifeProblemId, caseId, from, to });
  return NextResponse.json(series);
}
