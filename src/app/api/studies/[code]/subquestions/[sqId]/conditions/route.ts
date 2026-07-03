import { NextResponse } from 'next/server';
import { getStudyByCode, getSubquestions, addSubquestionCondition, deleteSubquestionCondition } from '@/lib/queries';

// Conditional visibility (0050): a child subquestion is shown only when a parent
// CHOICE subquestion's answer equals a trigger option label.
//
// POST   — add a condition { parentSubquestionId, triggerValue } to this child.
// DELETE — remove a condition by { id }.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; sqId: string }> }
) {
  const { code, sqId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  const subqs = await getSubquestions(study.id);
  const child = subqs.find((s) => s.id === sqId);
  if (!child) return NextResponse.json({ error: 'Subquestion not found' }, { status: 404 });

  const body = await request.json();
  const parentId = typeof body.parentSubquestionId === 'string' ? body.parentSubquestionId : '';
  const parent = subqs.find((s) => s.id === parentId);
  if (!parent) return NextResponse.json({ error: 'parentSubquestionId must be a subquestion of this study' }, { status: 400 });
  if (parent.id === child.id) return NextResponse.json({ error: 'a subquestion cannot depend on itself' }, { status: 400 });
  if (parent.kind !== 'choice') return NextResponse.json({ error: 'the parent must be a choice subquestion' }, { status: 400 });
  const triggerValue = typeof body.triggerValue === 'string' ? body.triggerValue.trim() : '';
  if (!triggerValue) return NextResponse.json({ error: 'triggerValue is required' }, { status: 400 });
  if (!parent.options.some((o) => o.label === triggerValue)) {
    return NextResponse.json({ error: 'triggerValue must be one of the parent option labels' }, { status: 400 });
  }

  const row = await addSubquestionCondition(sqId, parentId, triggerValue);
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; sqId: string }> }
) {
  const { code, sqId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  const subqs = await getSubquestions(study.id);
  const child = subqs.find((s) => s.id === sqId);
  if (!child) return NextResponse.json({ error: 'Subquestion not found' }, { status: 404 });

  const body = await request.json();
  if (typeof body.id !== 'string' || !child.conditions.some((c) => c.id === body.id)) {
    return NextResponse.json({ error: 'id must be a condition of this subquestion' }, { status: 400 });
  }
  await deleteSubquestionCondition(body.id);
  return NextResponse.json({ ok: true });
}
