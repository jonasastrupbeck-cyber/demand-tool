import { NextResponse } from 'next/server';
import { getStudyByCode, renameTaxonomyType, resolveSingleFkTaxonomy } from '@/lib/queries';

// PATCH: rename a single type (inline rename in the synthesis surface).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; taxonomy: string; id: string }> }
) {
  const { code, taxonomy, id } = await params;
  const tax = resolveSingleFkTaxonomy(taxonomy);
  if (!tax) return NextResponse.json({ error: 'Unknown taxonomy' }, { status: 404 });
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  if (typeof body.label !== 'string' || !body.label.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }
  await renameTaxonomyType(study.id, tax, id, body.label.trim());
  return NextResponse.json({ success: true });
}
