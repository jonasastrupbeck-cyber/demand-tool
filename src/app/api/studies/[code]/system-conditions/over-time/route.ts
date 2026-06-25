import { NextResponse } from 'next/server';
import { getStudyByCode, getSystemConditionOverTime } from '@/lib/queries';

// GET: per-day occurrence counts per (live) system condition for the synthesis
// over-time line chart. Flat rows { date, systemConditionId, count }.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const p2bs = new URL(request.url).searchParams.get('p2bs') || undefined;
  const rows = await getSystemConditionOverTime(study.id, p2bs);
  return NextResponse.json(rows);
}
