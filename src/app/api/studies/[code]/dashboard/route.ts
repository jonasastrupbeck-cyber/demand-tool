import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getDashboardData } from '@/lib/dashboard-aggregations';

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
  const from = parseDateParam(searchParams.get('from'));
  const to = parseDateParam(searchParams.get('to'));
  const valueDemands = searchParams.get('valueDemands')?.split(',').filter(Boolean);

  const data = await getDashboardData(study.id, from, to, valueDemands);
  return NextResponse.json(data);
}
