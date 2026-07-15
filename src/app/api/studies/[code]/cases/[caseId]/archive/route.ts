import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, setCaseArchived, verifyConsultantPin } from '@/lib/queries';

// POST: archive/unarchive a case (consultant-only). Archiving hides the case + its
// touches from every dashboard, count and the case list, but is reversible. Gated by
// the study's consultant PIN (sent in the body); a study with no PIN set is open.
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

  const body = await request.json().catch(() => ({}));
  if (!verifyConsultantPin(study, typeof body.pin === 'string' ? body.pin : '')) {
    return NextResponse.json({ error: 'Wrong PIN' }, { status: 403 });
  }
  if (typeof body.archived !== 'boolean') {
    return NextResponse.json({ error: 'archived (boolean) is required' }, { status: 400 });
  }

  await setCaseArchived(caseId, body.archived);
  return NextResponse.json({ success: true });
}
