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

  const p2bs = new URL(request.url).searchParams.get('p2bs') || undefined;
  const frequencies = await getSystemConditionFrequencies(study.id, p2bs);
  return NextResponse.json(frequencies);
}
