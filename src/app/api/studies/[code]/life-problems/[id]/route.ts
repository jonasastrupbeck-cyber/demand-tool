import { NextResponse } from 'next/server';
import { getStudyByCode, rowBelongsToStudy, deleteLifeProblem, updateLifeProblem } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (!(await rowBelongsToStudy('lifeProblems', id, study.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: { label?: string; operationalDefinition?: string | null } = {};
  if (body.label !== undefined) updates.label = body.label;
  if (body.operationalDefinition !== undefined) updates.operationalDefinition = body.operationalDefinition || null;

  await updateLifeProblem(id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (!(await rowBelongsToStudy('lifeProblems', id, study.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await deleteLifeProblem(id);
  return new Response(null, { status: 204 });
}
