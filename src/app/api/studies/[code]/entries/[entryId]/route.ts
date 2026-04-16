import { NextResponse } from 'next/server';
import { getStudyByCode, updateEntry, deleteEntry, getEntries, getWhatMattersForEntry, getSystemConditionsForEntry, getThinkingsForEntry, getWorkBlocksForEntry } from '@/lib/queries';

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

  const [wmRows, scRows, thRows, wbRows] = await Promise.all([
    getWhatMattersForEntry(entryId),
    getSystemConditionsForEntry(entryId),
    getThinkingsForEntry(entryId),
    getWorkBlocksForEntry(entryId),
  ]);

  return NextResponse.json({
    entry,
    whatMattersTypeIds: wmRows.map((r) => r.whatMattersTypeId),
    systemConditions: scRows.map((r) => ({
      id: r.systemConditionId,
      dimension: (r.dimension === 'helps' ? 'helps' : 'hinders') as 'helps' | 'hinders',
    })),
    thinkings: thRows.map((r) => ({ id: r.thinkingId, logic: r.logic ?? '' })),
    workBlocks: wbRows.map((r) => ({
      tag: (r.tag === 'value' ? 'value' : 'failure') as 'value' | 'failure',
      text: r.text,
    })),
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
  if (body.systemConditions !== undefined) {
    if (!Array.isArray(body.systemConditions) || !body.systemConditions.every((s: unknown) =>
      s && typeof s === 'object' && typeof (s as { id?: unknown }).id === 'string'
    )) {
      return NextResponse.json({ error: 'systemConditions must be an array of { id, dimension? }' }, { status: 400 });
    }
    updates.systemConditions = body.systemConditions.map((s: { id: string; dimension?: string }) => ({
      id: s.id,
      dimension: (s.dimension === 'helps' ? 'helps' : 'hinders') as 'helps' | 'hinders',
    }));
  }
  if (body.thinkings !== undefined) {
    if (!Array.isArray(body.thinkings) || !body.thinkings.every((t: unknown) =>
      t && typeof t === 'object' && typeof (t as { id?: unknown }).id === 'string'
    )) {
      return NextResponse.json({ error: 'thinkings must be an array of { id, logic? }' }, { status: 400 });
    }
    updates.thinkings = body.thinkings.map((t: { id: string; logic?: string }) => ({
      id: t.id,
      logic: typeof t.logic === 'string' ? t.logic : '',
    }));
  }
  if (body.contactMethodId !== undefined) updates.contactMethodId = body.contactMethodId;
  if (body.pointOfTransactionId !== undefined) updates.pointOfTransactionId = body.pointOfTransactionId;
  if (body.workTypeId !== undefined) updates.workTypeId = body.workTypeId;
  if (body.whatMatters !== undefined) updates.whatMatters = body.whatMatters;
  if (body.lifeProblemId !== undefined) updates.lifeProblemId = body.lifeProblemId;
  if (body.workBlocks !== undefined) {
    if (!Array.isArray(body.workBlocks) || !body.workBlocks.every((b: unknown) =>
      b && typeof b === 'object'
      && ((b as { tag?: unknown }).tag === 'value' || (b as { tag?: unknown }).tag === 'failure')
      && typeof (b as { text?: unknown }).text === 'string'
    )) {
      return NextResponse.json({ error: 'workBlocks must be an array of { tag: "value"|"failure", text: string }' }, { status: 400 });
    }
    updates.workBlocks = body.workBlocks.map((b: { tag: 'value' | 'failure'; text: string }) => ({
      tag: b.tag,
      text: b.text,
    }));
  }

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
