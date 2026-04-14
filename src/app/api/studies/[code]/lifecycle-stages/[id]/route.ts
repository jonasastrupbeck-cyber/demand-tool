import { NextResponse } from 'next/server';
import { getStudyByCode, updateLifecycleStage, deleteLifecycleStage } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const updates: { label?: string; sortOrder?: number } = {};
  if (typeof body.label === 'string') updates.label = body.label.trim();
  if (typeof body.sortOrder === 'number') updates.sortOrder = body.sortOrder;
  await updateLifecycleStage(id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  await deleteLifecycleStage(id);
  return new Response(null, { status: 204 });
}
