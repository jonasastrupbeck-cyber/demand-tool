import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workTypes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getStudyByCode, rowBelongsToStudy, deleteWorkType, updateWorkType } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (!(await rowBelongsToStudy('workTypes', id, study.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  // Validate the whole body BEFORE writing anything — otherwise an invalid
  // category returned 400 after the label rename had already committed.
  if (body.category !== undefined && body.category !== 'value' && body.category !== 'failure' && body.category !== 'sequence') {
    return NextResponse.json({ error: 'category must be value | failure | sequence' }, { status: 400 });
  }
  const fields: { label?: string; category?: 'value' | 'failure' | 'sequence' } = {};
  if (typeof body.label === 'string' && body.label.trim()) fields.label = body.label.trim();
  if (body.category !== undefined) fields.category = body.category;
  if (Object.keys(fields).length > 0) await updateWorkType(id, fields);
  if (body.lifecycleStageId !== undefined) {
    await db.update(workTypes).set({ lifecycleStageId: body.lifecycleStageId }).where(eq(workTypes.id, id));
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (!(await rowBelongsToStudy('workTypes', id, study.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await deleteWorkType(id);
  return new Response(null, { status: 204 });
}
