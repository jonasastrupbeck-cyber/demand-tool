import { NextResponse } from 'next/server';
import { getStudyByCode, getSubquestions, getMilestones, getWhatMattersTypes, updateSubquestion, deleteSubquestion, kindsCompatible, type SubquestionKind } from '@/lib/queries';
import { validateFormula } from '@/lib/formula';

const KINDS: SubquestionKind[] = ['amount', 'number', 'percent', 'currency', 'calculated', 'date', 'duration', 'duration_months', 'text', 'choice'];

// PATCH — rename / toggle required / change field type (compatible kinds only) /
// relink what-matters / move to another milestone / reorder.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; sqId: string }> }
) {
  const { code, sqId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  const subqs = await getSubquestions(study.id);
  const current = subqs.find((s) => s.id === sqId);
  if (!current) {
    return NextResponse.json({ error: 'Subquestion not found' }, { status: 404 });
  }

  const body = await request.json();
  const data: Parameters<typeof updateSubquestion>[1] = {};
  if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
  if (typeof body.required === 'boolean') data.required = body.required;
  // Field type is editable only within its compatibility class (same answer
  // column → no captured answer stranded). Reject a cross-class change.
  if (body.kind !== undefined) {
    if (!KINDS.includes(body.kind)) {
      return NextResponse.json({ error: 'invalid kind' }, { status: 400 });
    }
    if (!kindsCompatible(current.kind as SubquestionKind, body.kind)) {
      return NextResponse.json({ error: 'kind can only change within its compatibility class' }, { status: 400 });
    }
    data.kind = body.kind;
  }
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;
  if (body.currencyCode === null) {
    data.currencyCode = null;
  } else if (typeof body.currencyCode === 'string') {
    data.currencyCode = body.currencyCode || null;
  }
  if (body.formula === null) {
    data.formula = null;
  } else if (typeof body.formula === 'string') {
    const trimmed = body.formula.trim();
    // Reject a structurally invalid formula — it would store and then render
    // blank forever at capture (the editor also guards this client-side).
    if (trimmed && !validateFormula(trimmed)) {
      return NextResponse.json({ error: 'Formula is not valid' }, { status: 400 });
    }
    data.formula = trimmed || null;
  }
  if (body.resultFormat === null) {
    data.resultFormat = null;
  } else if (typeof body.resultFormat === 'string') {
    data.resultFormat = body.resultFormat === 'percent' ? 'percent' : null;
  }
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
  const subqs = await getSubquestions(study.id);
  if (!subqs.some((s) => s.id === sqId)) {
    return NextResponse.json({ error: 'Subquestion not found' }, { status: 404 });
  }
  await deleteSubquestion(sqId);
  return NextResponse.json({ ok: true });
}
