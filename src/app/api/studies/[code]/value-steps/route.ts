import { NextResponse } from 'next/server';
import { getStudyByCode, getValueSteps, addValueStep } from '@/lib/queries';

// Value steps (migration 0047) — editable study-level list; a flow work block
// tags one. Mirrors work-step-types minus the tag.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  return NextResponse.json(await getValueSteps(study.id));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  if (!body.label || typeof body.label !== 'string' || !body.label.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }
  const id = await addValueStep(study.id, body.label.trim());
  return NextResponse.json({ id }, { status: 201 });
}
