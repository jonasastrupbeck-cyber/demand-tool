import { NextResponse } from 'next/server';
import { getStudyByCode, getMilestones, addMilestone } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const rows = await getMilestones(study.id);
  return NextResponse.json(rows);
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
    return NextResponse.json({ error: 'label is required' }, { status: 400 });
  }

  const row = await addMilestone(study.id, body.label.trim());
  return NextResponse.json(row, { status: 201 });
}
