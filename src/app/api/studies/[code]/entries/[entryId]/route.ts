import { NextResponse } from 'next/server';
import { getStudyByCode, updateEntry, deleteEntry, getEntries, getWhatMattersForEntry, getSystemConditionsForEntry } from '@/lib/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string; entryId: string }> }
) {
  const { code, entryId } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const entries = await getEntries(study.id);
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  const [wmRows, scRows] = await Promise.all([
    getWhatMattersForEntry(entryId),
    getSystemConditionsForEntry(entryId),
  ]);

  return NextResponse.json({
    entry,
    whatMattersTypeIds: wmRows.map((r) => r.whatMattersTypeId),
    systemConditionIds: scRows.map((r) => r.systemConditionId),
  });
}

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
  if (body.systemConditionIds !== undefined) updates.systemConditionIds = body.systemConditionIds;
  if (body.contactMethodId !== undefined) updates.contactMethodId = body.contactMethodId;
  if (body.pointOfTransactionId !== undefined) updates.pointOfTransactionId = body.pointOfTransactionId;
  if (body.workTypeId !== undefined) updates.workTypeId = body.workTypeId;
  if (body.whatMatters !== undefined) updates.whatMatters = body.whatMatters;

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
