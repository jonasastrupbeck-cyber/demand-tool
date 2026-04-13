import { NextResponse } from 'next/server';
import { getStudyByCode, updateEntry, deleteEntry } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; entryId: string }> }
) {
  const { code, entryId } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const body = await request.json();

  const updates: Parameters<typeof updateEntry>[1] = {};
  if (body.classification !== undefined) updates.classification = body.classification;
  if (body.demandTypeId !== undefined) updates.demandTypeId = body.demandTypeId;
  if (body.handlingTypeId !== undefined) updates.handlingTypeId = body.handlingTypeId;
  if (body.linkedValueDemandEntryId !== undefined) updates.linkedValueDemandEntryId = body.linkedValueDemandEntryId;
  if (body.originalValueDemandTypeId !== undefined) updates.originalValueDemandTypeId = body.originalValueDemandTypeId;
  if (body.failureCause !== undefined) updates.failureCause = body.failureCause;
  if (body.whatMattersTypeIds !== undefined) updates.whatMattersTypeIds = body.whatMattersTypeIds;

  await updateEntry(entryId, updates);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string; entryId: string }> }
) {
  const { code, entryId } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  await deleteEntry(entryId);
  return NextResponse.json({ success: true });
}
