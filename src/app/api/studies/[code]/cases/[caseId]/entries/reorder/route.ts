import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getCaseEntries, reorderCaseEntries } from '@/lib/queries';

// Drag-reorder a flow case's touches (migration 0034). One call sets the whole
// case's order (body: { orderedIds: string[] }) and, when a touch was moved,
// sets its date (body: { movedId, date: 'YYYY-MM-DD' }). Returns the refreshed
// timeline so the client can update without a second round-trip.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> }
) {
  const { code, caseId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const caseRow = await getCase(caseId);
  if (!caseRow || caseRow.studyId !== study.id) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const body = await request.json();
  if (!Array.isArray(body.orderedIds) || !body.orderedIds.every((x: unknown) => typeof x === 'string')) {
    return NextResponse.json({ error: 'orderedIds must be an array of ids' }, { status: 400 });
  }

  const owned = new Set((await getCaseEntries(caseId)).map((e) => e.id));
  // Must cover exactly the case's touches — guards against stale/partial lists.
  if (body.orderedIds.length !== owned.size || !body.orderedIds.every((id: string) => owned.has(id))) {
    return NextResponse.json({ error: 'orderedIds must list every touch in this case exactly once' }, { status: 400 });
  }

  let moved: { id: string; date: string } | undefined;
  if (body.movedId !== undefined || body.date !== undefined) {
    if (typeof body.movedId !== 'string' || !owned.has(body.movedId)) {
      return NextResponse.json({ error: 'movedId must be a touch in this case' }, { status: 400 });
    }
    if (typeof body.date !== 'string' || isNaN(new Date(body.date).getTime())) {
      return NextResponse.json({ error: 'date must be a valid date' }, { status: 400 });
    }
    moved = { id: body.movedId, date: body.date };
  }

  await reorderCaseEntries(caseId, body.orderedIds, moved);
  return NextResponse.json({ success: true, entries: await getCaseEntries(caseId) });
}
