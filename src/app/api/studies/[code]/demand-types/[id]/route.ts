import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { demandTypes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getStudyByCode, deleteDemandType, updateDemandType } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const updates: { label?: string; operationalDefinition?: string | null } = {};
  if (typeof body.label === 'string' && body.label.trim()) updates.label = body.label.trim();
  if (body.operationalDefinition !== undefined) updates.operationalDefinition = body.operationalDefinition || null;

  if (Object.keys(updates).length > 0) {
    await updateDemandType(id, updates);
  }

  // Manual lifecycle override (separate path because it's not part of updateDemandType's signature)
  if (body.lifecycleStageId !== undefined) {
    await db.update(demandTypes).set({ lifecycleStageId: body.lifecycleStageId }).where(eq(demandTypes.id, id));
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

  await deleteDemandType(id);
  return new Response(null, { status: 204 });
}
