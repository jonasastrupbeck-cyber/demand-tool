import { NextResponse } from 'next/server';
import { getStudyByCode, deleteSystemCondition, updateSystemCondition } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const updates: { operationalDefinition?: string | null } = {};
  if (body.operationalDefinition !== undefined) updates.operationalDefinition = body.operationalDefinition || null;

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

  await deleteSystemCondition(id);
  return new Response(null, { status: 204 });
}
