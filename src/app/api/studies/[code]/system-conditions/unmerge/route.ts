import { NextResponse } from 'next/server';
import { getStudyByCode, undoSystemConditionMerge } from '@/lib/queries';

// POST: undo a merge — re-point every recorded record back to its source,
// un-archive the sources, and restore any rename of the surviving condition.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const { mergeId } = body ?? {};
  if (typeof mergeId !== 'string' || !mergeId) {
    return NextResponse.json({ error: 'mergeId is required' }, { status: 400 });
  }

  try {
    const result = await undoSystemConditionMerge(study.id, mergeId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Undo failed' }, { status: 400 });
  }
}
