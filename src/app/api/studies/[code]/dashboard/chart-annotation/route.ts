import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode, getChartAnnotations, upsertChartAnnotation } from '@/lib/queries';

// Generic per-point chart annotation (note / exclude-from-limits) for the
// touches-per-case, steps-per-case (work-block) and over-time-explorer XmR
// charts. Scoped by (chartKey, pointKey) under the study. The lead-time
// CapabilityChart uses the separate .../capability/annotation route.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const chartKey = request.nextUrl.searchParams.get('chartKey');
  if (!chartKey) return NextResponse.json({ error: 'chartKey is required' }, { status: 400 });

  const rows = await getChartAnnotations(study.id, chartKey);
  return NextResponse.json({
    annotations: rows.map((r) => ({
      pointKey: r.pointKey,
      excluded: r.excluded,
      excludedReason: r.excludedReason,
      note: r.note,
    })),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  if (typeof body.chartKey !== 'string' || typeof body.pointKey !== 'string') {
    return NextResponse.json({ error: 'chartKey and pointKey are required' }, { status: 400 });
  }

  await upsertChartAnnotation(study.id, {
    chartKey: body.chartKey,
    pointKey: body.pointKey,
    excluded: typeof body.excluded === 'boolean' ? body.excluded : undefined,
    excludedReason: 'excludedReason' in body ? (typeof body.excludedReason === 'string' ? body.excludedReason.trim() || null : null) : undefined,
    note: 'note' in body ? (typeof body.note === 'string' ? body.note.trim() || null : null) : undefined,
  });
  return NextResponse.json({ success: true });
}
