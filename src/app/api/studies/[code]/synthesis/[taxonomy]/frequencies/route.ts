import { NextResponse } from 'next/server';
import { getStudyByCode, getTaxonomyFrequencies, resolveSingleFkTaxonomy } from '@/lib/queries';

// GET: per-type reference counts for the taxonomy synthesis histogram/pie.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; taxonomy: string }> }
) {
  const { code, taxonomy } = await params;
  const tax = resolveSingleFkTaxonomy(taxonomy);
  if (!tax) return NextResponse.json({ error: 'Unknown taxonomy' }, { status: 404 });
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  return NextResponse.json(await getTaxonomyFrequencies(study.id, tax));
}
