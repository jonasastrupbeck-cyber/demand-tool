import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getCorDistribution } from '@/lib/dashboard-aggregations';

const TAGS = ['value', 'sequence', 'failure', 'failure_demand'] as const;

// Capability-of-Response distribution across flow work touches, optionally scoped
// to touches involving a given work classification (tags). Scoped by value demand.
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
  const tags = sp.get('tags')?.split(',').filter((t) => (TAGS as readonly string[]).includes(t));

  const data = await getCorDistribution(study.id, { from, to, valueDemands, tags });
  return NextResponse.json(data);
}
