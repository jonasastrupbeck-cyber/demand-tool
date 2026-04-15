import { NextResponse } from 'next/server';
import { getStudyByCode, deleteThinking, updateThinking } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const updates: { label?: string; operationalDefinition?: string | null } = {};
  if (body.label !== undefined && typeof body.label === 'string') updates.label = body.label.trim();
  if (body.operationalDefinition !== undefined) updates.operationalDefinition = body.operationalDefinition || null;

  await updateThinking(id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  await deleteThinking(id);
  return new Response(null, { status: 204 });
}
