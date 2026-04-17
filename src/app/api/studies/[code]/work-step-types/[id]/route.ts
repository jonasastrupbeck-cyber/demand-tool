import { NextResponse } from 'next/server';
import { getStudyByCode, deleteWorkStepType, updateWorkStepType } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const updates: { label?: string; tag?: 'value' | 'failure'; operationalDefinition?: string | null } = {};

  if (typeof body.label === 'string' && body.label.trim()) updates.label = body.label.trim();
  if (body.tag === 'value' || body.tag === 'failure') updates.tag = body.tag;
  if (body.operationalDefinition !== undefined) updates.operationalDefinition = body.operationalDefinition || null;

  if (Object.keys(updates).length > 0) {
    await updateWorkStepType(id, updates);
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

  // ON DELETE SET NULL means referencing blocks revert to free-text automatically.
  await deleteWorkStepType(id);
  return new Response(null, { status: 204 });
}
