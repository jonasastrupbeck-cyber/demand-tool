import { NextResponse } from 'next/server';
import { getStudyByCode, getWorkSources, addWorkSource } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const sources = await getWorkSources(study.id);
  return NextResponse.json(sources);
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

  const id = await addWorkSource(study.id, body.label.trim());
  return NextResponse.json({ id }, { status: 201 });
}
