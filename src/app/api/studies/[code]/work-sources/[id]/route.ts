import { NextResponse } from 'next/server';
import { getStudyByCode, deleteWorkSource, updateWorkSource } from '@/lib/queries';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  await deleteWorkSource(id);
  return new Response(null, { status: 204 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const updates: { label?: string; customerFacing?: boolean } = {};
  if (typeof body.label === 'string') updates.label = body.label.trim();
  if (typeof body.customerFacing === 'boolean') updates.customerFacing = body.customerFacing;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updatable fields' }, { status: 400 });
  }
  await updateWorkSource(id, updates);
  return new Response(null, { status: 204 });
}
