import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStudyByCode, createEntry, getEntries, getEntryCountToday, getPendingCounts, getFailureCauseSuggestions, getCase, validateStudyRefs, collectEntryRefs, getEntryInStudy } from '@/lib/queries';
import { parseDateParam } from '@/lib/local-date';

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
  const from = parseDateParam(searchParams.get('from'));
  const to = parseDateParam(searchParams.get('to'));

  const [entries, todayCount] = await Promise.all([
    getEntries(study.id, from, to),
    getEntryCountToday(study.id),
  ]);

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
    && ((b as { tag?: unknown }).tag === 'value' || (b as { tag?: unknown }).tag === 'sequence' || (b as { tag?: unknown }).tag === 'failure' || (b as { tag?: unknown }).tag === 'failure_demand')
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

  // Case stitching (Skipton slice 1): an entry may attach to a case, but only
  // one that exists and belongs to this study.
  let validatedCaseId: string | null = null;
  if (typeof body.caseId === 'string' && body.caseId) {
    const caseRow = await getCase(body.caseId);
    if (!caseRow || caseRow.studyId !== study.id) {
      return NextResponse.json({ error: 'Case not found in this study' }, { status: 400 });
    }
    validatedCaseId = caseRow.id;
  }

  // Validate per-block dates up front — an unparseable string would throw only
  // once Drizzle serializes the insert, after other rows are written.
  if (Array.isArray(body.workBlocks)) {
    for (const b of body.workBlocks) {
      if (b && typeof b.date === 'string' && b.date && isNaN(new Date(b.date).getTime())) {
        return NextResponse.json({ error: 'A work block has an invalid date' }, { status: 400 });
      }
    }
  }

  // Reject cross-study references before writing (foreign ids would corrupt this
  // study's aggregations or FK-500 mid-write).
  const refError = await validateStudyRefs(study.id, collectEntryRefs(body));
  if (refError) return NextResponse.json({ error: refError }, { status: 400 });
  if (typeof body.linkedValueDemandEntryId === 'string' && body.linkedValueDemandEntryId) {
    if (!(await getEntryInStudy(study.id, body.linkedValueDemandEntryId))) {
      return NextResponse.json({ error: 'Linked value-demand entry not found in this study' }, { status: 400 });
    }
  }

  const id = await createEntry(study.id, {
    verbatim: (body.verbatim || '').trim(),
    classification: body.classification,
    entryType,
    handlingTypeId: body.handlingTypeId || undefined,
    demandTypeId: body.demandTypeId || undefined,
    contactMethodId: body.contactMethodId || undefined,
    pointOfTransactionId: body.pointOfTransactionId || undefined,
    workSourceId: body.workSourceId || undefined,
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
    workTypeFreeText: typeof body.workTypeFreeText === 'string' ? body.workTypeFreeText.trim() || undefined : undefined,
    linkedValueDemandEntryId: body.linkedValueDemandEntryId || undefined,
    failureCause: body.failureCause?.trim() || undefined,
    whatMatters: body.whatMatters?.trim() || undefined,
    collectorName: body.collectorName?.trim() || undefined,
    lifeProblemId: body.lifeProblemId || undefined,
    // Case stitching (Skipton slice 1): ownership validated below before use.
    caseId: validatedCaseId,
    workBlocks: entryType === 'work' && workBlocksValid
      ? body.workBlocks.map((b: { tag: 'value' | 'sequence' | 'failure' | 'failure_demand'; text: string; workStepTypeId?: string | null; systemConditionId?: string | null; systemConditionIds?: unknown; demandTypeId?: string | null; valueStepId?: string | null; date?: string | null }) => ({
          tag: b.tag,
          text: b.text,
          workStepTypeId: typeof b.workStepTypeId === 'string' ? b.workStepTypeId : null,
          systemConditionId: typeof b.systemConditionId === 'string' ? b.systemConditionId : null,
          systemConditionIds: Array.isArray(b.systemConditionIds) ? b.systemConditionIds.filter((x): x is string => typeof x === 'string') : undefined,
          demandTypeId: typeof b.demandTypeId === 'string' ? b.demandTypeId : null,
          valueStepId: typeof b.valueStepId === 'string' ? b.valueStepId : null,
          date: typeof b.date === 'string' ? b.date : null,
        }))
      : undefined,
    // C7 (2026-06-17): did the customer feel this touch? (defaults client-side
    // from the chosen COR's customerFacing; overridable). null = not answered.
    customerFelt: typeof body.customerFelt === 'boolean' ? body.customerFelt : null,
    // Value creation capability (0059): fixed enum, only kept for work entries.
    valueCreationCapability: ['created', 'maintained', 'missed'].includes(body.valueCreationCapability)
      ? body.valueCreationCapability
      : undefined,
    // Worked-on-by (0065): free-text, who did the work (overridable collector).
    workedByName: typeof body.workedByName === 'string' && body.workedByName.trim()
      ? body.workedByName.trim()
      : undefined,
  });

  // Fold the three post-save refreshes into this response so the client skips
  // three extra round-trips (entries list, pending counts, failure-cause
  // suggestions) on every save. Parallel queries — fast server-side, one
  // network hop for the client. (Perf P1, 2026-04-19.)
  const [entries, pendingCounts, failureCauseSuggestions] = await Promise.all([
    getEntries(study.id),
    getPendingCounts(study.id),
    getFailureCauseSuggestions(study.id),
  ]);
  return NextResponse.json(
    { id, entries, pendingCounts, failureCauseSuggestions },
    { status: 201 },
  );
}
