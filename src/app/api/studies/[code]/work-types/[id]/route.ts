import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workTypes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getStudyByCode, deleteWorkType, updateWorkType } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  if (typeof body.label === 'string' && body.label.trim()) {
    await updateWorkType(id, { label: body.label.trim() });
  }
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

  await deleteWorkType(id);
  return new Response(null, { status: 204 });
}
