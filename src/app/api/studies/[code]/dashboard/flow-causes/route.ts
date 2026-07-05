import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getFailureCausesForFlow } from '@/lib/dashboard-aggregations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get('source');
  const target = searchParams.get('target');

  if (!source || !target) {
    return NextResponse.json({ error: 'source and target query params required' }, { status: 400 });
  }

  const from = parseDateParam(searchParams.get('from'));
  const to = parseDateParam(searchParams.get('to'));

  const causes = await getFailureCausesForFlow(study.id, source, target, from, to);
  return NextResponse.json({ causes });
}
