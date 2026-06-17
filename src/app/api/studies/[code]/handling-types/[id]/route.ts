import { NextResponse } from 'next/server';
import { getStudyByCode, deleteHandlingType, updateHandlingType } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const updates: { label?: string; operationalDefinition?: string | null; customerFacing?: boolean } = {};
  if (typeof body.label === 'string' && body.label.trim()) updates.label = body.label.trim();
  if (body.operationalDefinition !== undefined) updates.operationalDefinition = body.operationalDefinition || null;
  // C7 (2026-06-17): mark a Capability of Response as customer-facing vs internal.
  if (typeof body.customerFacing === 'boolean') updates.customerFacing = body.customerFacing;

  await updateHandlingType(id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  await deleteHandlingType(id);
  return new Response(null, { status: 204 });
}
