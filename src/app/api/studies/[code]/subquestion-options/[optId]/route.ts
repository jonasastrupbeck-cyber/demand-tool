import { NextResponse } from 'next/server';
import { getStudyByCode, getSubquestions, updateSubquestionOption, deleteSubquestionOption, type OptionPolarity } from '@/lib/queries';

const POLARITIES: OptionPolarity[] = ['positive', 'negative'];

// Does this option belong to a subquestion of this study?
async function ownsOption(studyId: string, optId: string) {
  const subqs = await getSubquestions(studyId);
  return subqs.some((s) => s.options.some((o) => o.id === optId));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; optId: string }> }
) {
  const { code, optId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  if (!(await ownsOption(study.id, optId))) {
    return NextResponse.json({ error: 'Option not found' }, { status: 404 });
  }

  const body = await request.json();
  const data: Parameters<typeof updateSubquestionOption>[1] = {};
  if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;
  if (body.polarity === null) data.polarity = null;
  else if (POLARITIES.includes(body.polarity)) data.polarity = body.polarity;

  await updateSubquestionOption(optId, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; optId: string }> }
) {
  const { code, optId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  if (!(await ownsOption(study.id, optId))) {
    return NextResponse.json({ error: 'Option not found' }, { status: 404 });
  }
  await deleteSubquestionOption(optId);
  return NextResponse.json({ ok: true });
}
