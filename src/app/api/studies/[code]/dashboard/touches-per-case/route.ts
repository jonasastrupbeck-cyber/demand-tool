import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getTouchesPerCaseCapability } from '@/lib/dashboard-aggregations';

// Touches-per-case XmR data: one point per case = its total touch count (a touch
// = one work entry with ≥1 block), with control limits. Scoped by value demand.
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

  const data = await getTouchesPerCaseCapability(study.id, { valueDemands, from, to });
  return NextResponse.json(data);
}
