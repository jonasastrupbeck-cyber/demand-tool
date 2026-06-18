import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getCaseMilestones, upsertCaseMilestone, getMilestones } from '@/lib/queries';

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
  return NextResponse.json(await getCaseMilestones(caseId));
}

// POST = upsert on (caseId, milestoneId): recording a milestone outcome and
// editing it are the same call. A 'not_achieved' outcome closes the case;
// 'achieved' (re)opens it. Undo is DELETE on the case-milestone id.
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
  const ms = await getMilestones(study.id);
  if (typeof body.milestoneId !== 'string' || !ms.some((m) => m.id === body.milestoneId)) {
    return NextResponse.json({ error: 'milestoneId must be a milestone of this study' }, { status: 400 });
  }
  if (body.outcome !== 'achieved' && body.outcome !== 'not_achieved') {
    return NextResponse.json({ error: 'outcome must be "achieved" or "not_achieved"' }, { status: 400 });
  }
  let reachedAt: Date | undefined;
  if (body.reachedAt !== undefined) {
    const parsed = new Date(body.reachedAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'reachedAt is not a valid date' }, { status: 400 });
    }
    reachedAt = parsed;
  }

  const row = await upsertCaseMilestone(caseId, {
    milestoneId: body.milestoneId,
    outcome: body.outcome,
    reachedAt,
    recordedByCollector: typeof body.recordedByCollector === 'string' ? body.recordedByCollector.trim() || null : null,
  });
  return NextResponse.json(row, { status: 201 });
}
