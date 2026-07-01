import { NextResponse } from 'next/server';
import { getStudyByCode, getDecisionPointTypes, addDecisionOutcomeType, type OutcomeTone } from '@/lib/queries';

const TONES: OutcomeTone[] = ['on_target', 'variation', 'negative'];

// POST — add an outcome to a decision point of this study.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const types = await getDecisionPointTypes(study.id);
  if (!types.some((t) => t.id === id)) {
    return NextResponse.json({ error: 'Decision point type not found' }, { status: 404 });
  }

  const body = await request.json();
  if (!body.label || typeof body.label !== 'string' || !body.label.trim()) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 });
  }
  // Default to on_target (green) when unspecified; otherwise must be a valid tone.
  const tone: OutcomeTone = body.tone === undefined ? 'on_target' : body.tone;
  if (!TONES.includes(tone)) {
    return NextResponse.json({ error: 'tone must be on_target, variation or negative' }, { status: 400 });
  }

  const row = await addDecisionOutcomeType(id, body.label.trim(), tone);
  return NextResponse.json(row, { status: 201 });
}
