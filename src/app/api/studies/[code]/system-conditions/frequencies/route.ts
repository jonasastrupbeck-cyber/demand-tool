import { NextResponse } from 'next/server';
import { getStudyByCode, getSystemConditionFrequencies } from '@/lib/queries';

// GET: per-condition reference counts (live conditions only) for the synthesis
// histogram.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const valueDemands = new URL(request.url).searchParams.get('valueDemands')?.split(',').filter(Boolean);
  const frequencies = await getSystemConditionFrequencies(study.id, valueDemands);
  return NextResponse.json(frequencies);
}
