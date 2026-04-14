import { NextResponse } from 'next/server';
import { getStudyByCode, getLifecycleStages, addLifecycleStage, seedDefaultLifecycleStages } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const stages = await getLifecycleStages(study.id);
  return NextResponse.json(stages);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();

  // Special action: seed default stages for this study
  if (body.action === 'seed') {
    await seedDefaultLifecycleStages(study.id, body.locale || 'en');
    const stages = await getLifecycleStages(study.id);
    return NextResponse.json({ success: true, stages });
  }

  if (!body.label || typeof body.label !== 'string') {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }
  const id = await addLifecycleStage(study.id, body.label.trim(), body.code || 'custom');
  return NextResponse.json({ id }, { status: 201 });
}
