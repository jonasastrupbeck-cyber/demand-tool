import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
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
  const dateFrom = sp.get('dateFrom') ? new Date(sp.get('dateFrom')!) : undefined;
  const dateTo = sp.get('dateTo') ? new Date(sp.get('dateTo')!) : undefined;
  const sort = sp.get('sort') === 'closed' ? 'closed' : 'start';

  const data = await getCapabilityData(study.id, fromEvent, toEvent, dateFrom, dateTo, sort);
  return NextResponse.json(data);
}
