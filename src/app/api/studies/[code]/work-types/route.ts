import { NextResponse } from 'next/server';
import { getStudyByCode, getWorkTypes, addWorkType } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const types = await getWorkTypes(study.id);
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
  if (body.category !== 'value' && body.category !== 'failure' && body.category !== 'sequence') {
    return NextResponse.json({ error: 'category must be value | failure | sequence' }, { status: 400 });
  }

  const row = await addWorkType(study.id, body.label.trim(), body.category);
  return NextResponse.json(row, { status: 201 });
}
