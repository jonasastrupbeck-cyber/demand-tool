import { NextResponse } from 'next/server';
import { getStudyByCode, getDecisionPointTypes, addDecisionPointType } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const types = await getDecisionPointTypes(study.id);
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
  for (const field of ['label', 'positiveLabel', 'negativeLabel'] as const) {
    if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const row = await addDecisionPointType(study.id, body.label.trim(), body.positiveLabel.trim(), body.negativeLabel.trim());
  return NextResponse.json(row, { status: 201 });
}
