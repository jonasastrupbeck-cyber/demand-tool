import { NextResponse } from 'next/server';
import { getStudyByCode, updateValueStep, deleteValueStep } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const updates: { label?: string; sortOrder?: number } = {};
  if (typeof body.label === 'string' && body.label.trim()) updates.label = body.label.trim();
  if (typeof body.sortOrder === 'number') updates.sortOrder = body.sortOrder;
  if (Object.keys(updates).length > 0) await updateValueStep(id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  // ON DELETE SET NULL means referencing blocks revert to unset automatically.
  await deleteValueStep(id);
  return new Response(null, { status: 204 });
}
