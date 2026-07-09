import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getWhatMattersDelivery } from '@/lib/dashboard-aggregations';

// "Meeting what matters" overview: per timed what-matters type, how well we
// delivered on it (met the date / typical time to completion). Scoped by value
// demand + the case-open date range.
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

  const data = await getWhatMattersDelivery(study.id, { from, to, valueDemands });
  return NextResponse.json(data);
}
