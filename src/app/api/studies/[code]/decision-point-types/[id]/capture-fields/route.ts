import { NextResponse } from 'next/server';
import { getStudyByCode, getDecisionPointTypes, getWhatMattersTypes, addDecisionCaptureField, type CaptureFieldKind } from '@/lib/queries';

const KINDS: CaptureFieldKind[] = ['amount', 'date', 'duration', 'choice'];

// POST — add a capture field (a delivered-value box) to a decision point of
// this study. Kind is immutable after create; choiceOptions only for 'choice'.
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
  if (!KINDS.includes(body.kind)) {
    return NextResponse.json({ error: 'kind must be amount, date, duration or choice' }, { status: 400 });
  }
  const choiceOptions = body.kind === 'choice' && typeof body.choiceOptions === 'string' && body.choiceOptions.trim()
    ? body.choiceOptions.trim()
    : null;
  let linkedWhatMattersTypeId: string | null = null;
  if (typeof body.linkedWhatMattersTypeId === 'string' && body.linkedWhatMattersTypeId) {
    const wmTypes = await getWhatMattersTypes(study.id);
    if (!wmTypes.some((w) => w.id === body.linkedWhatMattersTypeId)) {
      return NextResponse.json({ error: 'linkedWhatMattersTypeId must be a what-matters type of this study' }, { status: 400 });
    }
    linkedWhatMattersTypeId = body.linkedWhatMattersTypeId;
  }

  const row = await addDecisionCaptureField(id, { label: body.label.trim(), kind: body.kind, choiceOptions, linkedWhatMattersTypeId });
  return NextResponse.json(row, { status: 201 });
}
