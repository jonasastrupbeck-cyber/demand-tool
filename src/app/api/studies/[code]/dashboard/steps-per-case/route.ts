import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getStepsPerCaseCapability } from '@/lib/dashboard-aggregations';

const TAGS = ['total', 'value', 'sequence', 'failure', 'failure_demand'] as const;

// Steps-per-case XmR data: one point per case = its step count for the chosen tag
// (count or %), with control limits. Scoped by value demand.
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
  const tagParam = sp.get('tag');
  const tag = (TAGS as readonly string[]).includes(tagParam ?? '') ? (tagParam as typeof TAGS[number]) : 'total';
  const mode = sp.get('mode') === 'pct' ? 'pct' : 'count';
  const valueStepId = sp.get('valueStep') || undefined;

  const data = await getStepsPerCaseCapability(study.id, { valueDemands, from, to, tag, mode, valueStepId });
  return NextResponse.json(data);
}
