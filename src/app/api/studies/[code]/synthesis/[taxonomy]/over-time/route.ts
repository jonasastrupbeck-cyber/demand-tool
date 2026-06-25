import { NextResponse } from 'next/server';
import { getStudyByCode, getTaxonomyOverTime, resolveSingleFkTaxonomy } from '@/lib/queries';

// GET: per-day occurrence counts per type for the over-time line chart.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; taxonomy: string }> }
) {
  const { code, taxonomy } = await params;
  const tax = resolveSingleFkTaxonomy(taxonomy);
  if (!tax) return NextResponse.json({ error: 'Unknown taxonomy' }, { status: 404 });
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const p2bs = new URL(request.url).searchParams.get('p2bs') || undefined;
  return NextResponse.json(await getTaxonomyOverTime(study.id, tax, p2bs));
}
