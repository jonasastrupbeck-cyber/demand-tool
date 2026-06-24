import { NextResponse } from 'next/server';
import { getStudyByCode, undoTaxonomyMerge, resolveSingleFkTaxonomy } from '@/lib/queries';

// POST: undo a merge — re-point the recorded records back, un-archive the sources.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; taxonomy: string }> }
) {
  const { code, taxonomy } = await params;
  const tax = resolveSingleFkTaxonomy(taxonomy);
  if (!tax) return NextResponse.json({ error: 'Unknown taxonomy' }, { status: 404 });
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const { mergeId } = body ?? {};
  if (typeof mergeId !== 'string' || !mergeId) {
    return NextResponse.json({ error: 'mergeId is required' }, { status: 400 });
  }
  try {
    return NextResponse.json(await undoTaxonomyMerge(study.id, tax, mergeId));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Undo failed' }, { status: 400 });
  }
}
