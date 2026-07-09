import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getP2bsValueDemandLinks } from '@/lib/dashboard-aggregations';

// P2BS → value demand overview: which life problems the cases' value demands
// trace back to (case-mediated co-occurrence). Scoped by value demand + the
// case-open date range.
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

  const data = await getP2bsValueDemandLinks(study.id, { from, to, valueDemands });
  return NextResponse.json(data);
}
