import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getCaseDecisions, deleteCaseDecision } from '@/lib/queries';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; caseId: string; decisionId: string }> }
) {
  const { code, caseId, decisionId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  const caseRow = await getCase(caseId);
  if (!caseRow || caseRow.studyId !== study.id) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }
  const decisions = await getCaseDecisions(caseId);
  if (!decisions.some((d) => d.id === decisionId)) {
    return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
  }

  await deleteCaseDecision(decisionId);
  return NextResponse.json({ success: true });
}
