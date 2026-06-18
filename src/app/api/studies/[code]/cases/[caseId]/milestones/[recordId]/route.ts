import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getCaseMilestones, deleteCaseMilestone } from '@/lib/queries';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; caseId: string; recordId: string }> }
) {
  const { code, caseId, recordId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  const caseRow = await getCase(caseId);
  if (!caseRow || caseRow.studyId !== study.id) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }
  const rows = await getCaseMilestones(caseId);
  if (!rows.some((m) => m.id === recordId)) {
    return NextResponse.json({ error: 'Milestone record not found' }, { status: 404 });
  }

  // Removing a 'not_achieved' record reopens the case (see deleteCaseMilestone).
  await deleteCaseMilestone(recordId);
  return NextResponse.json({ success: true });
}
