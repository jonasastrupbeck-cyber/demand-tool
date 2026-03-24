import { NextResponse } from 'next/server';
import { getStudyByCode, getDemandTypes, addDemandType } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const types = await getDemandTypes(study.id);
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
  if (!body.category || !['value', 'failure'].includes(body.category)) {
    return NextResponse.json({ error: 'Category must be "value" or "failure"' }, { status: 400 });
  }

  const id = await addDemandType(study.id, body.category, body.label.trim());
  return NextResponse.json({ id }, { status: 201 });
}
