import { NextResponse } from 'next/server';
import { getStudyByCode, getTaxonomyMerges, mergeTaxonomy, getDemandTypeMerges, mergeDemandTypes, getHybridMerges, mergeHybridTaxonomy, resolveSynthesisTaxonomy, isDemandTaxonomy, isHybridTaxonomy, demandCategoryOf } from '@/lib/queries';

// GET: recent merges for the undo log.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; taxonomy: string }> }
) {
  const { code, taxonomy } = await params;
  const tax = resolveSynthesisTaxonomy(taxonomy);
  if (!tax) return NextResponse.json({ error: 'Unknown taxonomy' }, { status: 404 });
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (isHybridTaxonomy(tax)) {
    return NextResponse.json(await getHybridMerges(study.id, tax));
  }
  if (isDemandTaxonomy(tax)) {
    return NextResponse.json(await getDemandTypeMerges(study.id, demandCategoryOf(tax)));
  }
  return NextResponse.json(await getTaxonomyMerges(study.id, tax));
}

// POST: merge source types into a survivor, optionally renaming it.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; taxonomy: string }> }
) {
  const { code, taxonomy } = await params;
  const tax = resolveSynthesisTaxonomy(taxonomy);
  if (!tax) return NextResponse.json({ error: 'Unknown taxonomy' }, { status: 404 });
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const { targetId, sourceIds, newLabel } = body ?? {};
  if (typeof targetId !== 'string' || !targetId) {
    return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
  }
  if (!Array.isArray(sourceIds) || sourceIds.length === 0 || !sourceIds.every((s) => typeof s === 'string')) {
    return NextResponse.json({ error: 'sourceIds must be a non-empty string array' }, { status: 400 });
  }
  const label = typeof newLabel === 'string' ? newLabel : undefined;
  try {
    const result = isHybridTaxonomy(tax)
      ? await mergeHybridTaxonomy(study.id, tax, { targetId, sourceIds, newLabel: label })
      : isDemandTaxonomy(tax)
      ? await mergeDemandTypes(study.id, demandCategoryOf(tax), { targetId, sourceIds, newLabel: label })
      : await mergeTaxonomy(study.id, tax, { targetId, sourceIds, newLabel: label });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Merge failed' }, { status: 400 });
  }
}
