import { NextResponse } from 'next/server';
import { getStudyByCode, mergeSystemConditions, getSystemConditionMerges } from '@/lib/queries';

// GET: recent merges (for the synthesis undo log).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const merges = await getSystemConditionMerges(study.id);
  return NextResponse.json(merges);
}

// POST: merge one or more source conditions into a surviving target, optionally
// renaming the target to the agreed common name. Cascades to every linked record.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
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

  try {
    const result = await mergeSystemConditions(study.id, {
      targetId,
      sourceIds,
      newLabel: typeof newLabel === 'string' ? newLabel : undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Merge failed' }, { status: 400 });
  }
}
