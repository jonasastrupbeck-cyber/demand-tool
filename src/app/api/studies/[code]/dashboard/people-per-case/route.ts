import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getPeoplePerValueDemandCapability, type CaseStatusFilter } from '@/lib/dashboard-aggregations';

// People-per-value-demand XmR data: one point per case (= one value demand) =
// the number of distinct people who worked on it, with control limits. Scoped by
// value demand + case status (all/open/closed).
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
  const valueDemands = sp.get('valueDemands')?.split(',').filter(Boolean);
  const statusParam = sp.get('status');
  const status: CaseStatusFilter = statusParam === 'open' || statusParam === 'closed' ? statusParam : undefined;

  const data = await getPeoplePerValueDemandCapability(study.id, { valueDemands, from, to, status });
  return NextResponse.json(data);
}
