import { NextResponse } from 'next/server';
import { getStudyByCode, getSubquestions, getMilestones, getWhatMattersTypes, updateSubquestion, deleteSubquestion } from '@/lib/queries';

async function ownsSubquestion(studyId: string, sqId: string) {
  const subqs = await getSubquestions(studyId);
  return subqs.some((s) => s.id === sqId);
}

// PATCH — rename / toggle required / relink what-matters / move to another
// milestone / reorder. Kind is immutable (omitted deliberately).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; sqId: string }> }
) {
  const { code, sqId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  if (!(await ownsSubquestion(study.id, sqId))) {
    return NextResponse.json({ error: 'Subquestion not found' }, { status: 404 });
  }

  const body = await request.json();
  const data: Parameters<typeof updateSubquestion>[1] = {};
  if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
  if (typeof body.required === 'boolean') data.required = body.required;
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;
  if (body.linkedWhatMattersTypeId === null) {
    data.linkedWhatMattersTypeId = null;
  } else if (typeof body.linkedWhatMattersTypeId === 'string' && body.linkedWhatMattersTypeId) {
    const wmTypes = await getWhatMattersTypes(study.id);
    if (!wmTypes.some((w) => w.id === body.linkedWhatMattersTypeId)) {
      return NextResponse.json({ error: 'linkedWhatMattersTypeId must be a what-matters type of this study' }, { status: 400 });
    }
    data.linkedWhatMattersTypeId = body.linkedWhatMattersTypeId;
  }
  if (typeof body.milestoneId === 'string' && body.milestoneId) {
    const milestones = await getMilestones(study.id);
    if (!milestones.some((m) => m.id === body.milestoneId)) {
      return NextResponse.json({ error: 'milestoneId must be a milestone of this study' }, { status: 400 });
    }
    data.milestoneId = body.milestoneId;
  }

  await updateSubquestion(sqId, data);
  return NextResponse.json({ ok: true });
}

// DELETE — options + case answers cascade (consultant taxonomy fix).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; sqId: string }> }
) {
  const { code, sqId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  if (!(await ownsSubquestion(study.id, sqId))) {
    return NextResponse.json({ error: 'Subquestion not found' }, { status: 404 });
  }
  await deleteSubquestion(sqId);
  return NextResponse.json({ ok: true });
}
