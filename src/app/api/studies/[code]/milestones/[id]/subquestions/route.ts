import { NextResponse } from 'next/server';
import { getStudyByCode, getMilestones, getWhatMattersTypes, addSubquestion, type SubquestionKind } from '@/lib/queries';

const KINDS: SubquestionKind[] = ['amount', 'number', 'percent', 'currency', 'calculated', 'date', 'duration', 'duration_months', 'text', 'choice', 'multichoice'];

// POST — add a subquestion (a typed box) to a milestone of this study. Kind is
// immutable after create (see updateSubquestion).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const milestones = await getMilestones(study.id);
  if (!milestones.some((m) => m.id === id)) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
  }

  const body = await request.json();
  if (!body.label || typeof body.label !== 'string' || !body.label.trim()) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 });
  }
  if (!KINDS.includes(body.kind)) {
    return NextResponse.json({ error: 'kind must be amount, number, percent, currency, date, duration, text or choice' }, { status: 400 });
  }
  const currencyCode = typeof body.currencyCode === 'string' && body.currencyCode ? body.currencyCode : null;
  const formula = typeof body.formula === 'string' && body.formula.trim() ? body.formula : null;
  const resultFormat = body.resultFormat === 'percent' ? 'percent' : null;
  let linkedWhatMattersTypeId: string | null = null;
  if (typeof body.linkedWhatMattersTypeId === 'string' && body.linkedWhatMattersTypeId) {
    const wmTypes = await getWhatMattersTypes(study.id);
    if (!wmTypes.some((w) => w.id === body.linkedWhatMattersTypeId)) {
      return NextResponse.json({ error: 'linkedWhatMattersTypeId must be a what-matters type of this study' }, { status: 400 });
    }
    linkedWhatMattersTypeId = body.linkedWhatMattersTypeId;
  }
  const required = typeof body.required === 'boolean' ? body.required : true;

  const row = await addSubquestion(id, { label: body.label.trim(), kind: body.kind, required, linkedWhatMattersTypeId, currencyCode, formula, resultFormat });
  return NextResponse.json(row, { status: 201 });
}
