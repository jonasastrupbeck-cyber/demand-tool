import { NextResponse } from 'next/server';
import { getStudyByCode, getTaxonomyFrequencies, getDemandTypeFrequencies, getHybridFrequencies, resolveSynthesisTaxonomy, isDemandTaxonomy, isHybridTaxonomy, demandCategoryOf } from '@/lib/queries';

// GET: per-type reference counts for the taxonomy synthesis histogram/pie.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; taxonomy: string }> }
) {
  const { code, taxonomy } = await params;
  const tax = resolveSynthesisTaxonomy(taxonomy);
  if (!tax) return NextResponse.json({ error: 'Unknown taxonomy' }, { status: 404 });
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  // Demand types (0063) count across entries + the case junction + work blocks.
  // The value-demand filter isn't applied — it would be self-referential.
  if (isHybridTaxonomy(tax)) {
    return NextResponse.json(await getHybridFrequencies(study.id, tax));
  }
  if (isDemandTaxonomy(tax)) {
    return NextResponse.json(await getDemandTypeFrequencies(study.id, demandCategoryOf(tax)));
  }

  const valueDemands = new URL(request.url).searchParams.get('valueDemands')?.split(',').filter(Boolean);
  return NextResponse.json(await getTaxonomyFrequencies(study.id, tax, valueDemands));
}
