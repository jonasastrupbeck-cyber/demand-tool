import { NextResponse } from 'next/server';
import { getStudyByCode, getSubquestions, addSubquestionOption, type OptionPolarity } from '@/lib/queries';

const POLARITIES: OptionPolarity[] = ['positive', 'negative', 'concern'];

// POST — add an option to a choice subquestion. polarity is optional; 'negative'
// prompts the collector to close the case at capture (never auto-closes).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; sqId: string }> }
) {
  const { code, sqId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  const subqs = await getSubquestions(study.id);
  const sq = subqs.find((s) => s.id === sqId);
  if (!sq) return NextResponse.json({ error: 'Subquestion not found' }, { status: 404 });
  if (sq.kind !== 'choice') {
    return NextResponse.json({ error: 'options can only be added to a choice subquestion' }, { status: 400 });
  }

  const body = await request.json();
  if (!body.label || typeof body.label !== 'string' || !body.label.trim()) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 });
  }
  // Option labels must be unique per question — branching keys conditions and
  // child groups by label, so a duplicate would merge two answers into one.
  if (sq.options.some((o) => o.label.trim() === body.label.trim())) {
    return NextResponse.json({ error: 'An option with this label already exists' }, { status: 409 });
  }
  const polarity = POLARITIES.includes(body.polarity) ? body.polarity : null;
  const row = await addSubquestionOption(sqId, { label: body.label.trim(), polarity });
  return NextResponse.json(row, { status: 201 });
}
