import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getCaseByRef, getCaseEntries, updateCase, getCaseWhatMatters, setCaseWhatMattersDate, setCaseWhatMattersValue, getCaseMilestones, getCaseLifeProblemIds, getCaseDemandTypeIds, getCaseSubquestionAnswers, serializeCaseAnswers, getMilestones, getCaseVisibleSubquestionIds, getApplicableMilestoneIds, recomputeCaseMilestone, recomputeCaseClosure, validateStudyRefs, deleteCase, verifyConsultantPin, type CaseWhatMattersValue } from '@/lib/queries';

// Build the { whatMattersTypeId → ISO target date } map from junction rows.
function targetDatesOf(wmRows: { whatMattersTypeId: string; targetDate: Date | null }[]) {
  return Object.fromEntries(wmRows.filter((r) => r.targetDate).map((r) => [r.whatMattersTypeId, r.targetDate]));
}

// Structured ask values (2026-07-02): { whatMattersTypeId → six-field value }.
// A row is included when ANY of the six is set. whatMattersTargetDates above is
// kept as-is (dashboard/asap consumers).
type WmValueRow = { whatMattersTypeId: string; targetDate: Date | null; amountSpecific: number | null; amountMin: number | null; amountMax: number | null; termYears: number | null; termMonths: number | null };
function wmValuesOf(wmRows: WmValueRow[]) {
  return Object.fromEntries(
    wmRows
      .filter((r) => r.targetDate !== null || r.amountSpecific !== null || r.amountMin !== null || r.amountMax !== null || r.termYears !== null || r.termMonths !== null)
      .map((r) => [r.whatMattersTypeId, {
        targetDate: r.targetDate,
        amountSpecific: r.amountSpecific,
        amountMin: r.amountMin,
        amountMax: r.amountMax,
        termYears: r.termYears,
        termMonths: r.termMonths,
      }]),
  );
}

// Case detail + its timeline of touches (oldest first). The timeline ordered
// by createdAt IS the repeatable Capability-of-Response sequence.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> }
) {
  const { code, caseId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const caseRow = await getCase(caseId);
  if (!caseRow || caseRow.studyId !== study.id) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const [entries, wmRows, milestones, lifeProblemIds, demandTypeIds, subquestionAnswers] = await Promise.all([
    getCaseEntries(caseId),
    getCaseWhatMatters(caseId),
    getCaseMilestones(caseId),
    getCaseLifeProblemIds(caseId),
    getCaseDemandTypeIds(caseId),
    getCaseSubquestionAnswers(caseId),
  ]);
  return NextResponse.json({ ...caseRow, entries, whatMattersTypeIds: wmRows.map((r) => r.whatMattersTypeId), whatMattersTargetDates: targetDatesOf(wmRows), whatMattersValues: wmValuesOf(wmRows), milestones, lifeProblemIds, demandTypeIds, subquestionAnswers: serializeCaseAnswers(subquestionAnswers) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> }
) {
  const { code, caseId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const caseRow = await getCase(caseId);
  if (!caseRow || caseRow.studyId !== study.id) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const body = await request.json();
  const data: Parameters<typeof updateCase>[1] = {};

  // Case reference edit (2026-07-16) — from the consultant "Manage cases" list.
  // Gate ONLY when caseRef is present so the un-PIN'd capture-side PATCH callers
  // (status/date/channel/etc.) are unaffected. Reuses the same PIN + validation +
  // uniqueness rules as archive/delete and case creation.
  if (body.caseRef !== undefined) {
    if (!verifyConsultantPin(study, typeof body.pin === 'string' ? body.pin : '')) {
      return NextResponse.json({ error: 'Wrong PIN' }, { status: 403 });
    }
    const ref = typeof body.caseRef === 'string' ? body.caseRef.trim() : '';
    if (!ref || ref.length > 64) {
      return NextResponse.json({ error: 'caseRef must be 1–64 characters' }, { status: 400 });
    }
    // Per-study uniqueness (uniqStudyCaseRef): renaming onto another case's ref
    // would hit the DB constraint. Reject with a stable code the client maps to a
    // friendly message (a no-op rename to the same ref is allowed — same id).
    const clash = await getCaseByRef(study.id, ref);
    if (clash && clash.id !== caseId) {
      return NextResponse.json({ error: 'duplicate-case-ref' }, { status: 409 });
    }
    data.caseRef = ref;
  }

  if (body.demandTypeId !== undefined) data.demandTypeId = body.demandTypeId || null;
  if (body.status !== undefined) {
    if (!['open', 'closed'].includes(body.status)) {
      return NextResponse.json({ error: 'status must be "open" or "closed"' }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.openedAt !== undefined) {
    // Reject null/empty explicitly (new Date(null) = 1970 epoch passes isNaN and
    // would poison lead-time charts). openedAt cannot be cleared — a case always
    // has an open date.
    if (body.openedAt === null || body.openedAt === '') {
      return NextResponse.json({ error: 'openedAt is not a valid date' }, { status: 400 });
    }
    const parsed = new Date(body.openedAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'openedAt is not a valid date' }, { status: 400 });
    }
    data.openedAt = parsed;
  }
  if (body.closedAt !== undefined) {
    if (body.closedAt === null) {
      data.closedAt = null;
    } else {
      const parsed = new Date(body.closedAt);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'closedAt is not a valid date' }, { status: 400 });
      }
      data.closedAt = parsed;
    }
  }
  if (body.note !== undefined) data.note = typeof body.note === 'string' ? body.note : null;
  // Broker/Direct channel (0061). channel validated like status; firm/broker are free text.
  if (body.channel !== undefined) {
    if (body.channel !== null && !['broker', 'direct'].includes(body.channel)) {
      return NextResponse.json({ error: 'channel must be "broker", "direct" or null' }, { status: 400 });
    }
    data.channel = body.channel || null;
  }
  if (body.firmName !== undefined) data.firmName = typeof body.firmName === 'string' ? body.firmName : null;
  if (body.brokerName !== undefined) data.brokerName = typeof body.brokerName === 'string' ? body.brokerName : null;
  // Flow-mode person context (slice B).
  if (body.contextSituation !== undefined) data.contextSituation = typeof body.contextSituation === 'string' ? body.contextSituation : null;
  if (body.lifeProblemId !== undefined) data.lifeProblemId = body.lifeProblemId || null;
  if (body.whatMatters !== undefined) data.whatMatters = typeof body.whatMatters === 'string' ? body.whatMatters : null;
  if (body.whatMattersTypeIds !== undefined) {
    if (!Array.isArray(body.whatMattersTypeIds) || !body.whatMattersTypeIds.every((x: unknown) => typeof x === 'string')) {
      return NextResponse.json({ error: 'whatMattersTypeIds must be an array of ids' }, { status: 400 });
    }
    data.whatMattersTypeIds = body.whatMattersTypeIds;
  }
  if (body.lifeProblemIds !== undefined) {
    if (!Array.isArray(body.lifeProblemIds) || !body.lifeProblemIds.every((x: unknown) => typeof x === 'string')) {
      return NextResponse.json({ error: 'lifeProblemIds must be an array of ids' }, { status: 400 });
    }
    data.lifeProblemIds = body.lifeProblemIds;
  }
  if (body.demandTypeIds !== undefined) {
    if (!Array.isArray(body.demandTypeIds) || !body.demandTypeIds.every((x: unknown) => typeof x === 'string')) {
      return NextResponse.json({ error: 'demandTypeIds must be an array of ids' }, { status: 400 });
    }
    data.demandTypeIds = body.demandTypeIds;
  }

  // Set/clear the customer's wanted date for one 'by_date' what-matters type.
  // date === null (or '') clears it; a bad date string is rejected.
  let wmDate: { whatMattersTypeId: string; date: Date | null } | null = null;
  if (body.whatMattersDate !== undefined) {
    const wd = body.whatMattersDate;
    if (!wd || typeof wd.whatMattersTypeId !== 'string') {
      return NextResponse.json({ error: 'whatMattersDate needs a whatMattersTypeId' }, { status: 400 });
    }
    let d: Date | null = null;
    if (wd.date !== null && wd.date !== undefined && wd.date !== '') {
      const parsed = new Date(wd.date);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'whatMattersDate.date is not a valid date' }, { status: 400 });
      }
      d = parsed;
    }
    wmDate = { whatMattersTypeId: wd.whatMattersTypeId, date: d };
  }

  // Structured ask value (2026-07-02): the full six-field object for one type.
  // All six columns are written (nulls clear), so mode switches are atomic.
  let wmValue: { whatMattersTypeId: string; value: CaseWhatMattersValue } | null = null;
  if (body.whatMattersValue !== undefined) {
    const wv = body.whatMattersValue;
    if (!wv || typeof wv.whatMattersTypeId !== 'string') {
      return NextResponse.json({ error: 'whatMattersValue needs a whatMattersTypeId' }, { status: 400 });
    }
    let d: Date | null = null;
    if (wv.targetDate !== null && wv.targetDate !== undefined && wv.targetDate !== '') {
      const parsed = new Date(wv.targetDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'whatMattersValue.targetDate is not a valid date' }, { status: 400 });
      }
      d = parsed;
    }
    const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
    const int = (x: unknown) => (typeof x === 'number' && Number.isInteger(x) ? x : null);
    wmValue = {
      whatMattersTypeId: wv.whatMattersTypeId,
      value: {
        targetDate: d,
        amountSpecific: num(wv.amountSpecific),
        amountMin: num(wv.amountMin),
        amountMax: num(wv.amountMax),
        termYears: int(wv.termYears),
        termMonths: int(wv.termMonths),
      },
    };
  }

  // Reject cross-study references (foreign demand types / life problems /
  // what-matters ids would mis-scope milestones and dashboards).
  const refError = await validateStudyRefs(study.id, {
    demandTypes: [data.demandTypeId, ...(data.demandTypeIds ?? [])],
    lifeProblems: [data.lifeProblemId, ...(data.lifeProblemIds ?? [])],
    whatMattersTypes: [...(data.whatMattersTypeIds ?? []), wmDate?.whatMattersTypeId, wmValue?.whatMattersTypeId],
  });
  if (refError) return NextResponse.json({ error: refError }, { status: 400 });

  await updateCase(caseId, data);
  if (wmDate) await setCaseWhatMattersDate(caseId, wmDate.whatMattersTypeId, wmDate.date);
  if (wmValue) await setCaseWhatMattersValue(caseId, wmValue.whatMattersTypeId, wmValue.value);
  // Dynamic milestones (0051): changing the case's demand types changes which
  // milestones apply — and thus which is the "final" one — so recompute every
  // milestone and the auto-close/reopen. (Adding a type can reopen a case;
  // removing one can complete/close it.)
  if (data.demandTypeIds !== undefined) {
    // Independent reads — fetch concurrently. Each milestone's recompute writes an
    // independent row and reads only the shared precomputed sets, so run them
    // concurrently too (mirrors the answers route). Closure runs after all complete.
    const [visible, applicable, allMs] = await Promise.all([
      getCaseVisibleSubquestionIds(caseId, study.id),
      getApplicableMilestoneIds(caseId, study.id),
      getMilestones(study.id),
    ]);
    await Promise.all(allMs.map((m) => recomputeCaseMilestone(caseId, m.id, visible, applicable)));
    await recomputeCaseClosure(caseId, study.id);
  }
  const [updated, wmRows, lifeProblemIds, demandTypeIds] = await Promise.all([
    getCase(caseId),
    getCaseWhatMatters(caseId),
    getCaseLifeProblemIds(caseId),
    getCaseDemandTypeIds(caseId),
  ]);
  return NextResponse.json({ ...updated, whatMattersTypeIds: wmRows.map((r) => r.whatMattersTypeId), whatMattersTargetDates: targetDatesOf(wmRows), whatMattersValues: wmValuesOf(wmRows), lifeProblemIds, demandTypeIds });
}

// DELETE: permanently remove a case and all its touches (consultant-only). Gated by
// the study's consultant PIN — the first server-enforced PIN check in the app, since
// this is irreversible. PIN comes in the request body (the client sends the cached
// PIN). A study with no PIN set is open, matching pin-check.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> }
) {
  const { code, caseId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const caseRow = await getCase(caseId);
  if (!caseRow || caseRow.studyId !== study.id) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (!verifyConsultantPin(study, typeof body.pin === 'string' ? body.pin : '')) {
    return NextResponse.json({ error: 'Wrong PIN' }, { status: 403 });
  }

  await deleteCase(caseId);
  return NextResponse.json({ success: true });
}
