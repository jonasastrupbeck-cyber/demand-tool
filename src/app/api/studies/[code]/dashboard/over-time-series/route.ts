import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getOverTimeSeries, type OverTimeSeriesSpec } from '@/lib/dashboard-aggregations';

const TAGS = ['value', 'sequence', 'failure', 'failure_demand'] as const;

// Over-time explorer: one chosen series (a work-block tag or a system condition)
// per day within a chosen scope (value demands + value steps). Each row carries
// the scope's total block count so the client's % mode divides within the scope.
// series param: `tag:<tag>` or `sc:<systemConditionId>`.
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
  const valueStepIds = sp.get('valueSteps')?.split(',').filter(Boolean);

  const raw = sp.get('series') ?? '';
  let series: OverTimeSeriesSpec;
  if (raw.startsWith('tag:') && (TAGS as readonly string[]).includes(raw.slice(4))) {
    series = { kind: 'tag', tag: raw.slice(4) as (typeof TAGS)[number] };
  } else if (raw.startsWith('sc:') && raw.length > 3) {
    series = { kind: 'sc', systemConditionId: raw.slice(3) };
  } else {
    return NextResponse.json({ error: 'series must be tag:<value|sequence|failure|failure_demand> or sc:<id>' }, { status: 400 });
  }

  const rows = await getOverTimeSeries(study.id, { from, to, valueDemands, valueStepIds, series });
  return NextResponse.json({ rows });
}
