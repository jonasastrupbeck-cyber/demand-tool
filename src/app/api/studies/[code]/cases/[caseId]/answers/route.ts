import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getSubquestions, getMilestones, getCaseDemandTypeIds, getCaseMilestones, getCaseSubquestionAnswers, setCaseSubquestionAnswers, clearHiddenCaseAnswers, getCaseVisibleSubquestionIds, getApplicableMilestoneIds, recomputeCaseMilestone, recomputeCaseClosure } from '@/lib/queries';

// Decision-box redesign (0042): per-case subquestion answers. POST upserts a
// batch of answers (full objects, blanks clear), then re-derives the completion
// of each affected milestone. Replaces the old decisions POST.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> }
) {
  const { code, caseId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 400 });
  const caseRow = await getCase(caseId);
  if (!caseRow || caseRow.studyId !== study.id) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }
  return NextResponse.json(await getCaseSubquestionAnswers(caseId));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; caseId: string }> }
) {
  const { code, caseId } = await params;
  // Perf: read the case's demand types + current answers up front, alongside
  // study/case — all four need only the code/caseId, so one round-trip. These are
  // then threaded through every step below so the save never re-reads them.
  const [study, caseRow, caseDT, preAnswers] = await Promise.all([
    getStudyByCode(code),
    getCase(caseId),
    getCaseDemandTypeIds(caseId),
    getCaseSubquestionAnswers(caseId),
  ]);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  if (!caseRow || caseRow.studyId !== study.id) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const body = await request.json();
  if (!Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'answers must be an array' }, { status: 400 });
  }

  const subqs = await getSubquestions(study.id);
  const byId = new Map(subqs.map((s) => [s.id, s]));
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
  const int = (x: unknown) => (typeof x === 'number' && Number.isInteger(x) ? x : null);
  const parseDate = (x: unknown): Date | null | 'invalid' => {
    if (x === null || x === undefined || x === '') return null;
    const d = new Date(x as string);
    return isNaN(d.getTime()) ? 'invalid' : d;
  };

  const recordedByCollector = typeof body.recordedByCollector === 'string' ? body.recordedByCollector.trim() || null : null;
  const parsed: Parameters<typeof setCaseSubquestionAnswers>[1] = [];
  for (const a of body.answers) {
    if (!a || typeof a.subquestionId !== 'string' || !byId.has(a.subquestionId)) {
      return NextResponse.json({ error: 'every answers[].subquestionId must be a subquestion of this study' }, { status: 400 });
    }
    const vd = parseDate(a.valueDate);
    if (vd === 'invalid') return NextResponse.json({ error: 'answers[].valueDate is not a valid date' }, { status: 400 });
    const at = parseDate(a.answeredAt);
    if (at === 'invalid') return NextResponse.json({ error: 'answers[].answeredAt is not a valid date' }, { status: 400 });
    parsed.push({
      subquestionId: a.subquestionId,
      valueNumber: num(a.valueNumber),
      valueDate: vd,
      valueYears: int(a.valueYears),
      valueMonths: int(a.valueMonths),
      valueChoice: typeof a.valueChoice === 'string' && a.valueChoice.trim() ? a.valueChoice.trim() : null,
      valueText: typeof a.valueText === 'string' && a.valueText.trim() ? a.valueText.trim() : null,
      answeredAt: at,
      recordedByCollector,
    });
  }

  // Write the answers (pass the already-loaded subqs + current answers so the
  // upsert skips its own two reads).
  const touched = await setCaseSubquestionAnswers(caseId, parsed, subqs, preAnswers);
  // Conditional visibility (0050): drop answers to now-hidden subquestions, then
  // recompute EVERY milestone — a changed choice can hide/reveal children on
  // other milestones, not just the directly-touched ones.
  if (touched.length > 0) {
    // Read the post-write answers ONCE + the milestone metadata, concurrently.
    // Everything below reads from these in memory — no per-milestone re-reads.
    const [answersNow, allMs, existingCms, applicable] = await Promise.all([
      getCaseSubquestionAnswers(caseId),
      getMilestones(study.id),
      getCaseMilestones(caseId),
      getApplicableMilestoneIds(caseId, study.id, caseDT),
    ]);
    const visible = await getCaseVisibleSubquestionIds(caseId, study.id, subqs, answersNow);
    // Excluded / not-mandatory subquestion ids derived in memory from subqs
    // (each nests its demand-type sets) intersected with the case's demand types.
    const excluded = new Set(subqs.filter((s) => s.demandTypeExclusions.some((id) => caseDT.includes(id))).map((s) => s.id));
    const optional = new Set(subqs.filter((s) => s.demandTypeOptional.some((id) => caseDT.includes(id))).map((s) => s.id));
    const existingByMs = new Map(existingCms.map((r) => [r.milestoneId, r]));
    // Clearing hidden answers and recomputing each milestone are independent
    // writes — recompute only reads visible-required answers (never the hidden
    // ones being cleared), so run the whole group concurrently.
    await Promise.all([
      clearHiddenCaseAnswers(caseId, study.id, subqs, visible, answersNow),
      ...allMs.map((m) => recomputeCaseMilestone(caseId, m.id, visible, applicable, excluded, optional, subqs, study.id, existingByMs, answersNow)),
    ]);
    // Completing the final milestone auto-closes the case (un-completing reopens).
    await recomputeCaseClosure(caseId, study.id, applicable, allMs, caseRow);
  } else {
    // No write happened (empty payload) → answers unchanged and no completion can
    // change; still sweep any now-hidden answer for parity with the old always-run
    // clear, using the already-loaded data (a no-op unless one was left stale).
    const visible = await getCaseVisibleSubquestionIds(caseId, study.id, subqs, preAnswers);
    await clearHiddenCaseAnswers(caseId, study.id, subqs, visible, preAnswers);
  }
  // Return everything the client needs to update in place — the saved answers,
  // the recomputed milestone completions, and the (possibly auto-closed) status
  // — so the capture UI never has to refetch the whole case (one parallel read).
  const [answers, milestones, updatedCase] = await Promise.all([
    getCaseSubquestionAnswers(caseId),
    getCaseMilestones(caseId),
    getCase(caseId),
  ]);
  return NextResponse.json({ answers, milestones, status: updatedCase?.status ?? caseRow.status }, { status: 201 });
}
