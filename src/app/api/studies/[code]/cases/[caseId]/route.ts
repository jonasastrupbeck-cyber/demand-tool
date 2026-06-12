import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getCaseEntries, updateCase, getCaseWhatMatters } from '@/lib/queries';

// Case detail + its timeline of touches (oldest first). The timeline ordered
// by createdAt IS the repeatable Capability-of-Response sequence.
export async function GET(
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

  const [entries, wmRows] = await Promise.all([
    getCaseEntries(caseId),
    getCaseWhatMatters(caseId),
  ]);
  return NextResponse.json({ ...caseRow, entries, whatMattersTypeIds: wmRows.map((r) => r.whatMattersTypeId) });
}

export async function PATCH(
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
  const data: Parameters<typeof updateCase>[1] = {};

  if (body.demandTypeId !== undefined) data.demandTypeId = body.demandTypeId || null;
  if (body.status !== undefined) {
    if (!['open', 'closed'].includes(body.status)) {
      return NextResponse.json({ error: 'status must be "open" or "closed"' }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.openedAt !== undefined) {
    const parsed = new Date(body.openedAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'openedAt is not a valid date' }, { status: 400 });
    }
    data.openedAt = parsed;
  }
  if (body.closedAt !== undefined) {
    if (body.closedAt === null) {
      data.closedAt = null;
    } else {
      const parsed = new Date(body.closedAt);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'closedAt is not a valid date' }, { status: 400 });
      }
      data.closedAt = parsed;
    }
  }
  if (body.note !== undefined) data.note = typeof body.note === 'string' ? body.note : null;
  // Flow-mode person context (slice B).
  if (body.contextSituation !== undefined) data.contextSituation = typeof body.contextSituation === 'string' ? body.contextSituation : null;
  if (body.lifeProblemId !== undefined) data.lifeProblemId = body.lifeProblemId || null;
  if (body.whatMatters !== undefined) data.whatMatters = typeof body.whatMatters === 'string' ? body.whatMatters : null;
  if (body.whatMattersTypeIds !== undefined) {
    if (!Array.isArray(body.whatMattersTypeIds) || !body.whatMattersTypeIds.every((x: unknown) => typeof x === 'string')) {
      return NextResponse.json({ error: 'whatMattersTypeIds must be an array of ids' }, { status: 400 });
    }
    data.whatMattersTypeIds = body.whatMattersTypeIds;
  }

  await updateCase(caseId, data);
  const [updated, wmRows] = await Promise.all([getCase(caseId), getCaseWhatMatters(caseId)]);
  return NextResponse.json({ ...updated, whatMattersTypeIds: wmRows.map((r) => r.whatMattersTypeId) });
}
