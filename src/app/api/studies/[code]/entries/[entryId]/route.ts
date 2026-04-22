import { NextResponse } from 'next/server';
import { getStudyByCode, updateEntry, deleteEntry, getEntries, getWhatMattersForEntry, getSystemConditionsForEntry, getThinkingsForEntry, getThinkingScAttachmentsForEntry, getWorkBlocksForEntry } from '@/lib/queries';

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

  const [wmRows, scRows, thRows, thScRows, wbRows] = await Promise.all([
    getWhatMattersForEntry(entryId),
    getSystemConditionsForEntry(entryId),
    getThinkingsForEntry(entryId),
    getThinkingScAttachmentsForEntry(entryId),
    getWorkBlocksForEntry(entryId),
  ]);

  return NextResponse.json({
    entry,
    whatMattersTypeIds: wmRows.map((r) => r.whatMattersTypeId),
    systemConditions: scRows.map((r) => ({
      id: r.systemConditionId,
      dimension: (r.dimension === 'helps' ? 'helps' : 'hinders') as 'helps' | 'hinders',
      attachesToLifeProblem: r.attachesToLifeProblem,
      attachesToDemand:      r.attachesToDemand,
      attachesToWhatMatters: r.attachesToWhatMatters,
      attachesToCor:         r.attachesToCor,
      attachesToWork:        r.attachesToWork,
    })),
    thinkings: thRows.map((r) => ({
      id: r.thinkingId,
      logic: r.logic ?? '',
      dimension: (r.dimension === 'helps' ? 'helps' : 'hinders') as 'helps' | 'hinders',
      scAttachments: thScRows
        .filter((a) => a.thinkingId === r.thinkingId)
        .map((a) => ({ systemConditionId: a.systemConditionId })),
    })),
    workBlocks: wbRows.map((r) => ({
      tag: (r.tag === 'value' ? 'value' : r.tag === 'sequence' ? 'sequence' : 'failure') as 'value' | 'sequence' | 'failure',
      text: r.text,
      workStepTypeId: r.workStepTypeId ?? null,
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
    updates.systemConditions = body.systemConditions.map((s: {
      id: string;
      dimension?: string;
      attachesToLifeProblem?: boolean;
      attachesToDemand?: boolean;
      attachesToWhatMatters?: boolean;
      attachesToCor?: boolean;
      attachesToWork?: boolean;
    }) => ({
      id: s.id,
      dimension: (s.dimension === 'helps' ? 'helps' : 'hinders') as 'helps' | 'hinders',
      attachesToLifeProblem: !!s.attachesToLifeProblem,
      attachesToDemand:      !!s.attachesToDemand,
      attachesToWhatMatters: !!s.attachesToWhatMatters,
      attachesToCor:         !!s.attachesToCor,
      attachesToWork:        !!s.attachesToWork,
    }));
  }
  if (body.thinkings !== undefined) {
    if (!Array.isArray(body.thinkings) || !body.thinkings.every((t: unknown) =>
      t && typeof t === 'object' && typeof (t as { id?: unknown }).id === 'string'
    )) {
      return NextResponse.json({ error: 'thinkings must be an array of { id, logic?, scAttachments? }' }, { status: 400 });
    }
    updates.thinkings = body.thinkings.map((t: {
      id: string;
      logic?: string;
      dimension?: string;
      scAttachments?: { systemConditionId?: string }[];
    }) => ({
      id: t.id,
      logic: typeof t.logic === 'string' ? t.logic : '',
      dimension: (t.dimension === 'helps' ? 'helps' : 'hinders') as 'helps' | 'hinders',
      scAttachments: Array.isArray(t.scAttachments)
        ? t.scAttachments
            .filter((a) => typeof a.systemConditionId === 'string')
            .map((a) => ({ systemConditionId: a.systemConditionId as string }))
        : [],
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
      && ((b as { tag?: unknown }).tag === 'value' || (b as { tag?: unknown }).tag === 'sequence' || (b as { tag?: unknown }).tag === 'failure')
      && typeof (b as { text?: unknown }).text === 'string'
    )) {
      return NextResponse.json({ error: 'workBlocks must be an array of { tag: "value"|"sequence"|"failure", text: string }' }, { status: 400 });
    }
    updates.workBlocks = body.workBlocks.map((b: { tag: 'value' | 'sequence' | 'failure'; text: string; workStepTypeId?: string | null }) => ({
      tag: b.tag,
      text: b.text,
      workStepTypeId: typeof b.workStepTypeId === 'string' ? b.workStepTypeId : null,
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
