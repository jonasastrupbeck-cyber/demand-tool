import { NextResponse } from 'next/server';
import { getStudyByCode, getDecisionPointTypes, addDecisionPointType, getMilestones } from '@/lib/queries';

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

  // Optional: place the new decision point inside a milestone of this study.
  let milestoneId: string | null = null;
  if (typeof body.milestoneId === 'string' && body.milestoneId) {
    const ms = await getMilestones(study.id);
    if (!ms.some((m) => m.id === body.milestoneId)) {
      return NextResponse.json({ error: 'milestoneId not found in study' }, { status: 400 });
    }
    milestoneId = body.milestoneId;
  }

  const row = await addDecisionPointType(study.id, body.label.trim(), body.positiveLabel.trim(), body.negativeLabel.trim(), milestoneId);
  return NextResponse.json(row, { status: 201 });
}
