import { NextResponse } from 'next/server';
import { getStudyByCode, getDecisionOutcomeTypes, updateDecisionOutcomeType, deleteDecisionOutcomeType, type OutcomeTone } from '@/lib/queries';

const TONES: OutcomeTone[] = ['on_target', 'variation', 'negative'];

// Confirm the outcome belongs to a decision point of this study before mutating.
async function findOwnedOutcome(code: string, outcomeId: string) {
  const study = await getStudyByCode(code);
  if (!study) return { error: NextResponse.json({ error: 'Study not found' }, { status: 404 }) };
  const outcomes = await getDecisionOutcomeTypes(study.id);
  const outcome = outcomes.find((o) => o.id === outcomeId);
  if (!outcome) return { error: NextResponse.json({ error: 'Outcome not found' }, { status: 404 }) };
  return { outcome, study };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; outcomeId: string }> }
) {
  const { code, outcomeId } = await params;
  const owned = await findOwnedOutcome(code, outcomeId);
  if (owned.error) return owned.error;

  const body = await request.json();
  const data: Parameters<typeof updateDecisionOutcomeType>[1] = {};
  if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
  if (body.tone !== undefined) {
    if (!TONES.includes(body.tone)) {
      return NextResponse.json({ error: 'tone must be on_target, variation or negative' }, { status: 400 });
    }
    data.tone = body.tone;
  }
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;

  await updateDecisionOutcomeType(outcomeId, data);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; outcomeId: string }> }
) {
  const { code, outcomeId } = await params;
  const owned = await findOwnedOutcome(code, outcomeId);
  if (owned.error) return owned.error;

  // case_decision_points.decision_outcome_type_id is SET NULL (records survive).
  await deleteDecisionOutcomeType(outcomeId);
  return NextResponse.json({ success: true });
}
