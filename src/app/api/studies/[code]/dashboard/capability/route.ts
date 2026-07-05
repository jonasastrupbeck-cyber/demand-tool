import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getCapabilityData } from '@/lib/dashboard-aggregations';

// Capability / lead-time chart data: time between two chosen events across the
// study's cases, as XmR individuals-chart points + control limits. Read-only.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const fromEvent = sp.get('fromEvent');
  const toEvent = sp.get('toEvent');
  if (!fromEvent || !toEvent) {
    return NextResponse.json({ error: 'fromEvent and toEvent are required' }, { status: 400 });
  }
  const dateFrom = parseDateParam(sp.get('dateFrom'));
  const dateTo = parseDateParam(sp.get('dateTo'));
  const sort = sp.get('sort') === 'closed' ? 'closed' : 'start';
  const metricParam = sp.get('metric');
  const metric = metricParam === 'touches' ? 'touches' : metricParam === 'variance' ? 'variance' : 'leadTime';
  const p2bs = sp.get('p2bs') || undefined;
  const wmScope = sp.get('wmScope') || undefined;

  const data = await getCapabilityData(study.id, fromEvent, toEvent, dateFrom, dateTo, sort, metric, p2bs, wmScope);
  return NextResponse.json(data);
}
