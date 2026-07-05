import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { getBudgetCapability } from '@/lib/dashboard-aggregations';

// Budget capability (2026-07-05): per amount-kind linked field, the signed
// budget variance per case in answeredAt order. Same query params as the
// other dashboard endpoints (from/to = reachedAt range, p2bs = life problem
// scope).
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
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
  const lifeProblemId = searchParams.get('p2bs') || undefined;

  const fields = await getBudgetCapability(study.id, from, to, lifeProblemId);
  return NextResponse.json({ fields });
}
