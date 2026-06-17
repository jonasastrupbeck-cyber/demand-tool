import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getCaseDecisions, upsertCaseDecision, getDecisionPointTypes } from '@/lib/queries';

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
  return NextResponse.json(await getCaseDecisions(caseId));
}

// POST = upsert on (caseId, decisionPointTypeId): recording a decision and
// editing it are the same call. Undo is DELETE on the decision id.
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
  const types = await getDecisionPointTypes(study.id);
  if (typeof body.decisionPointTypeId !== 'string' || !types.some((t) => t.id === body.decisionPointTypeId)) {
    return NextResponse.json({ error: 'decisionPointTypeId must be a decision point of this study' }, { status: 400 });
  }
  if (body.outcome !== 'positive' && body.outcome !== 'negative') {
    return NextResponse.json({ error: 'outcome must be "positive" or "negative"' }, { status: 400 });
  }
  if (body.cleanliness !== 'clean' && body.cleanliness !== 'dirty') {
    return NextResponse.json({ error: 'cleanliness must be "clean" or "dirty"' }, { status: 400 });
  }
  let decidedAt: Date | undefined;
  if (body.decidedAt !== undefined) {
    const parsed = new Date(body.decidedAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'decidedAt is not a valid date' }, { status: 400 });
    }
    decidedAt = parsed;
  }

  const row = await upsertCaseDecision(caseId, {
    decisionPointTypeId: body.decisionPointTypeId,
    outcome: body.outcome,
    cleanliness: body.cleanliness,
    dirtyCause: typeof body.dirtyCause === 'string' ? body.dirtyCause.trim() || null : null,
    decidedAt,
    recordedByCollector: typeof body.recordedByCollector === 'string' ? body.recordedByCollector.trim() || null : null,
    // C9 (2026-06-17): affordability sub-states (person-kind milestones).
    willingnessToPay: typeof body.willingnessToPay === 'boolean' ? body.willingnessToPay : null,
    abilityToPay: typeof body.abilityToPay === 'boolean' ? body.abilityToPay : null,
  });
  return NextResponse.json(row, { status: 201 });
}
