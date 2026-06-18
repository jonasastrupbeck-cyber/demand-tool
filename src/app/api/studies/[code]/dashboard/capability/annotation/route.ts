import { NextRequest, NextResponse } from 'next/server';
import { getStudyByCode, getCase, upsertCapabilityAnnotation } from '@/lib/queries';

// Upsert a capability-chart annotation (exclude / reason / note) for one case,
// scoped to the measure (fromEvent → toEvent pair).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  if (typeof body.caseId !== 'string' || typeof body.fromEvent !== 'string' || typeof body.toEvent !== 'string') {
    return NextResponse.json({ error: 'caseId, fromEvent and toEvent are required' }, { status: 400 });
  }
  const caseRow = await getCase(body.caseId);
  if (!caseRow || caseRow.studyId !== study.id) {
    return NextResponse.json({ error: 'Case not found in study' }, { status: 404 });
  }

  await upsertCapabilityAnnotation(study.id, {
    caseId: body.caseId,
    fromEvent: body.fromEvent,
    toEvent: body.toEvent,
    excluded: typeof body.excluded === 'boolean' ? body.excluded : undefined,
    excludedReason: 'excludedReason' in body ? (typeof body.excludedReason === 'string' ? body.excludedReason.trim() || null : null) : undefined,
    note: 'note' in body ? (typeof body.note === 'string' ? body.note.trim() || null : null) : undefined,
  });
  return NextResponse.json({ success: true });
}
