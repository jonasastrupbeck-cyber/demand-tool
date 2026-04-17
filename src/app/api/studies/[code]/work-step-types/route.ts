import { NextResponse } from 'next/server';
import { getStudyByCode, getWorkStepTypes, addWorkStepType } from '@/lib/queries';

// Phase 4 (2026-04-16) — managed Work Step Types per study.
// Mirrors work-types routes; adds a required `tag` (value/failure) on creation
// because the tag is fixed at taxonomy level.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const types = await getWorkStepTypes(study.id);
  return NextResponse.json(types);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  if (!body.label || typeof body.label !== 'string') {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }
  if (body.tag !== 'value' && body.tag !== 'failure') {
    return NextResponse.json({ error: "Tag must be 'value' or 'failure'" }, { status: 400 });
  }

  const id = await addWorkStepType(study.id, body.label.trim(), body.tag);
  return NextResponse.json({ id }, { status: 201 });
}
