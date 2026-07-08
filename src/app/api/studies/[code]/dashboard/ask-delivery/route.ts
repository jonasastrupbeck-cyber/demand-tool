import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';
import { getAskDeliveryData } from '@/lib/dashboard-aggregations';

// Delivery on what matters (2026-07-02, slice 4): per linked capture field,
// how often the delivered value met the customer's ask. Same query params as
// the other dashboard endpoints (from/to = decidedAt range, p2bs = life
// problem scope).
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

  const rows = await getAskDeliveryData(study.id, from, to, valueDemands);
  return NextResponse.json({ rows });
}
