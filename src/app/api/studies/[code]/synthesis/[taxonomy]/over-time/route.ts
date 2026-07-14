import { NextResponse } from 'next/server';
import { getStudyByCode, getTaxonomyOverTime, resolveSynthesisTaxonomy, isDemandTaxonomy, isHybridTaxonomy } from '@/lib/queries';

// GET: per-day occurrence counts per type for the over-time line chart.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; taxonomy: string }> }
) {
  const { code, taxonomy } = await params;
  const tax = resolveSynthesisTaxonomy(taxonomy);
  if (!tax) return NextResponse.json({ error: 'Unknown taxonomy' }, { status: 404 });
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  // Demand types have no over-time chart (they live on both cases and entries, so
  // a single date axis would mislead). The client passes hasOverTime={false}.
  if (isDemandTaxonomy(tax) || isHybridTaxonomy(tax)) return NextResponse.json([]);

  const valueDemands = new URL(request.url).searchParams.get('valueDemands')?.split(',').filter(Boolean);
  return NextResponse.json(await getTaxonomyOverTime(study.id, tax, valueDemands));
}
