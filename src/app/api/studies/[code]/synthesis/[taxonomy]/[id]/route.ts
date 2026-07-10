import { NextResponse } from 'next/server';
import { getStudyByCode, renameTaxonomyType, renameDemandTypeForSynthesis, resolveSynthesisTaxonomy, isDemandTaxonomy, demandCategoryOf } from '@/lib/queries';

// PATCH: rename a single type (inline rename in the synthesis surface). Renaming
// onto a live sibling's label merges into it (see renameTaxonomyType).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; taxonomy: string; id: string }> }
) {
  const { code, taxonomy, id } = await params;
  const tax = resolveSynthesisTaxonomy(taxonomy);
  if (!tax) return NextResponse.json({ error: 'Unknown taxonomy' }, { status: 404 });
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  if (typeof body.label !== 'string' || !body.label.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }
  const label = body.label.trim();
  try {
    if (isDemandTaxonomy(tax)) await renameDemandTypeForSynthesis(study.id, demandCategoryOf(tax), id, label);
    else await renameTaxonomyType(study.id, tax, id, label);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Rename failed' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
