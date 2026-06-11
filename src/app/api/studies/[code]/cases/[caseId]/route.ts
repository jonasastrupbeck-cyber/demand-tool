import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getCaseEntries, updateCase } from '@/lib/queries';

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

  const entries = await getCaseEntries(caseId);
  return NextResponse.json({ ...caseRow, entries });
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

  await updateCase(caseId, data);
  const updated = await getCase(caseId);
  return NextResponse.json(updated);
}
