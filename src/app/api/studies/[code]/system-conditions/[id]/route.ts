import { NextResponse } from 'next/server';
import { getStudyByCode, rowBelongsToStudy, deleteSystemCondition, updateSystemCondition, getSystemConditions, mergeSystemConditions } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (!(await rowBelongsToStudy('systemConditions', id, study.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: { label?: string; operationalDefinition?: string | null } = {};
  if (typeof body.label === 'string' && body.label.trim()) updates.label = body.label.trim();
  if (body.operationalDefinition !== undefined) updates.operationalDefinition = body.operationalDefinition || null;

  // Synthesis intent (mergeOnCollision): renaming a condition to a name a LIVE
  // sibling already has means "these are the same" → merge into the existing
  // one rather than create a duplicate label. Settings rename omits the flag.
  if (body.mergeOnCollision === true && updates.label) {
    const dup = (await getSystemConditions(study.id)).find((c) => c.id !== id && c.label === updates.label);
    if (dup) {
      await mergeSystemConditions(study.id, { targetId: dup.id, sourceIds: [id] });
      return NextResponse.json({ success: true, merged: true });
    }
  }

  await updateSystemCondition(id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (!(await rowBelongsToStudy('systemConditions', id, study.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await deleteSystemCondition(id);
  return new Response(null, { status: 204 });
}
