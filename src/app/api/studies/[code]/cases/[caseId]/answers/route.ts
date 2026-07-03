import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getSubquestions, getCaseSubquestionAnswers, setCaseSubquestionAnswers, recomputeCaseMilestone, recomputeCaseClosure } from '@/lib/queries';

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
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  const caseRow = await getCase(caseId);
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

  const touched = await setCaseSubquestionAnswers(caseId, parsed);
  for (const milestoneId of touched) await recomputeCaseMilestone(caseId, milestoneId);
  // Completing the final milestone auto-closes the case (un-completing reopens).
  if (touched.length > 0) await recomputeCaseClosure(caseId, study.id);
  return NextResponse.json(await getCaseSubquestionAnswers(caseId), { status: 201 });
}
