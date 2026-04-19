import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode, createEntry, getEntries, getEntryCountToday } from '@/lib/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

  const entries = await getEntries(study.id, from, to);
  const todayCount = await getEntryCountToday(study.id);

  return NextResponse.json({ entries, todayCount });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const body = await request.json();

  // Work entries can supply workBlocks instead of verbatim — Phase 2 / Item 4.
  const entryType = body.entryType === 'work' ? 'work' : 'demand';
  const workBlocksValid = Array.isArray(body.workBlocks) && body.workBlocks.every((b: unknown) =>
    b && typeof b === 'object'
    && ((b as { tag?: unknown }).tag === 'value' || (b as { tag?: unknown }).tag === 'failure')
    && typeof (b as { text?: unknown }).text === 'string'
  );
  const hasWorkBlockText = workBlocksValid && body.workBlocks.some((b: { text: string }) => b.text.trim().length > 0);
  const hasVerbatim = typeof body.verbatim === 'string' && body.verbatim.trim().length > 0;
  if (!study.volumeMode && !hasVerbatim && !(entryType === 'work' && hasWorkBlockText)) {
    return NextResponse.json({ error: 'Demand verbatim is required' }, { status: 400 });
  }

  if (!body.classification || !['value', 'failure', 'unknown', 'sequence'].includes(body.classification)) {
    return NextResponse.json({ error: 'Classification must be "value", "failure", "unknown", or "sequence"' }, { status: 400 });
  }

  const id = await createEntry(study.id, {
    verbatim: (body.verbatim || '').trim(),
    classification: body.classification,
    entryType,
    handlingTypeId: body.handlingTypeId || undefined,
    demandTypeId: body.demandTypeId || undefined,
    contactMethodId: body.contactMethodId || undefined,
    pointOfTransactionId: body.pointOfTransactionId || undefined,
    whatMattersTypeId: body.whatMattersTypeId || undefined,
    whatMattersTypeIds: Array.isArray(body.whatMattersTypeIds) ? body.whatMattersTypeIds : undefined,
    systemConditions: Array.isArray(body.systemConditions) && body.systemConditions.every((s: unknown) =>
      s && typeof s === 'object' && typeof (s as { id?: unknown }).id === 'string'
    )
      ? body.systemConditions.map((s: {
          id: string;
          dimension?: string;
          attachesToLifeProblem?: boolean;
          attachesToDemand?: boolean;
          attachesToWhatMatters?: boolean;
          attachesToCor?: boolean;
          attachesToWork?: boolean;
        }) => ({
          id: s.id,
          dimension: s.dimension === 'helps' ? 'helps' as const : 'hinders' as const,
          attachesToLifeProblem: !!s.attachesToLifeProblem,
          attachesToDemand:      !!s.attachesToDemand,
          attachesToWhatMatters: !!s.attachesToWhatMatters,
          attachesToCor:         !!s.attachesToCor,
          attachesToWork:        !!s.attachesToWork,
        }))
      : undefined,
    thinkings: Array.isArray(body.thinkings) && body.thinkings.every((t: unknown) =>
      t && typeof t === 'object' && typeof (t as { id?: unknown }).id === 'string'
    )
      ? body.thinkings.map((t: {
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
        }))
      : undefined,
    originalValueDemandTypeId: body.originalValueDemandTypeId || undefined,
    workTypeId: body.workTypeId || undefined,
    linkedValueDemandEntryId: body.linkedValueDemandEntryId || undefined,
    failureCause: body.failureCause?.trim() || undefined,
    whatMatters: body.whatMatters?.trim() || undefined,
    collectorName: body.collectorName?.trim() || undefined,
    lifeProblemId: body.lifeProblemId || undefined,
    workBlocks: entryType === 'work' && workBlocksValid
      ? body.workBlocks.map((b: { tag: 'value' | 'failure'; text: string; workStepTypeId?: string | null }) => ({
          tag: b.tag,
          text: b.text,
          workStepTypeId: typeof b.workStepTypeId === 'string' ? b.workStepTypeId : null,
        }))
      : undefined,
  });

  return NextResponse.json({ id }, { status: 201 });
}
