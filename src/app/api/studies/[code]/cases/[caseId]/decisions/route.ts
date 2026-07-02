import { NextResponse } from 'next/server';
import { getStudyByCode, getCase, getCaseDecisions, upsertCaseDecision, getDecisionPointTypes, getDecisionOutcomeTypes, getDecisionCaptureFields, setCaseDecisionValues } from '@/lib/queries';

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
  return NextResponse.json(await getCaseDecisions(caseId));
}

// POST = upsert on (caseId, decisionPointTypeId): recording a decision and
// editing it are the same call. Undo is DELETE on the decision id.
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
  const types = await getDecisionPointTypes(study.id);
  if (typeof body.decisionPointTypeId !== 'string' || !types.some((t) => t.id === body.decisionPointTypeId)) {
    return NextResponse.json({ error: 'decisionPointTypeId must be a decision point of this study' }, { status: 400 });
  }

  // 2026-07-01: prefer an explicit outcome id (which decision answer was chosen);
  // it must belong to the posted decision point, and it DERIVES the coarse
  // positive/negative `outcome` (on_target/variation → positive, negative → red).
  // Fall back to the bare `outcome` field for legacy/compat callers.
  let decisionOutcomeTypeId: string | null = null;
  let outcome: 'positive' | 'negative';
  if (typeof body.decisionOutcomeTypeId === 'string' && body.decisionOutcomeTypeId) {
    const outcomes = await getDecisionOutcomeTypes(study.id);
    const chosen = outcomes.find((o) => o.id === body.decisionOutcomeTypeId && o.decisionPointTypeId === body.decisionPointTypeId);
    if (!chosen) {
      return NextResponse.json({ error: 'decisionOutcomeTypeId must be an outcome of this decision point' }, { status: 400 });
    }
    decisionOutcomeTypeId = chosen.id;
    outcome = chosen.tone === 'negative' ? 'negative' : 'positive';
  } else if (body.outcome === 'positive' || body.outcome === 'negative') {
    outcome = body.outcome;
  } else {
    return NextResponse.json({ error: 'decisionOutcomeTypeId or outcome ("positive"/"negative") is required' }, { status: 400 });
  }
  // Cleanliness is optional (clean/dirty capture removed 2026-06-26). Only accept
  // it if explicitly 'clean'/'dirty' (legacy clients); otherwise leave it unset.
  const cleanliness = body.cleanliness === 'clean' || body.cleanliness === 'dirty' ? body.cleanliness : null;
  let decidedAt: Date | undefined;
  if (body.decidedAt !== undefined) {
    const parsed = new Date(body.decidedAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'decidedAt is not a valid date' }, { status: 400 });
    }
    decidedAt = parsed;
  }

  // Capture-field values (2026-07-02): full objects per field, blanks as null.
  // Every fieldId must belong to the posted decision point type.
  let values: { fieldId: string; valueNumber: number | null; valueDate: Date | null; valueYears: number | null; valueMonths: number | null; valueChoice: string | null }[] | null = null;
  if (body.values !== undefined) {
    if (!Array.isArray(body.values)) {
      return NextResponse.json({ error: 'values must be an array' }, { status: 400 });
    }
    const fields = await getDecisionCaptureFields(study.id);
    const typeFieldIds = new Set(fields.filter((f) => f.decisionPointTypeId === body.decisionPointTypeId).map((f) => f.id));
    const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
    const int = (x: unknown) => (typeof x === 'number' && Number.isInteger(x) ? x : null);
    values = [];
    for (const v of body.values) {
      if (!v || typeof v.fieldId !== 'string' || !typeFieldIds.has(v.fieldId)) {
        return NextResponse.json({ error: 'every values[].fieldId must be a capture field of this decision point' }, { status: 400 });
      }
      let d: Date | null = null;
      if (v.valueDate !== null && v.valueDate !== undefined && v.valueDate !== '') {
        const parsed = new Date(v.valueDate);
        if (isNaN(parsed.getTime())) {
          return NextResponse.json({ error: 'values[].valueDate is not a valid date' }, { status: 400 });
        }
        d = parsed;
      }
      values.push({
        fieldId: v.fieldId,
        valueNumber: num(v.valueNumber),
        valueDate: d,
        valueYears: int(v.valueYears),
        valueMonths: int(v.valueMonths),
        valueChoice: typeof v.valueChoice === 'string' && v.valueChoice.trim() ? v.valueChoice.trim() : null,
      });
    }
  }

  const row = await upsertCaseDecision(caseId, {
    decisionPointTypeId: body.decisionPointTypeId,
    outcome,
    decisionOutcomeTypeId,
    cleanliness,
    dirtyCause: typeof body.dirtyCause === 'string' ? body.dirtyCause.trim() || null : null,
    decidedAt,
    recordedByCollector: typeof body.recordedByCollector === 'string' ? body.recordedByCollector.trim() || null : null,
    // C9 (2026-06-17): affordability sub-states (person-kind milestones).
    willingnessToPay: typeof body.willingnessToPay === 'boolean' ? body.willingnessToPay : null,
    abilityToPay: typeof body.abilityToPay === 'boolean' ? body.abilityToPay : null,
  });
  if (values) await setCaseDecisionValues(caseId, values);
  return NextResponse.json(row, { status: 201 });
}
