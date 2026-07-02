import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode } from '@/lib/queries';
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
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
  const lifeProblemId = searchParams.get('p2bs') || undefined;

  const rows = await getAskDeliveryData(study.id, from, to, lifeProblemId);
  return NextResponse.json({ rows });
}
