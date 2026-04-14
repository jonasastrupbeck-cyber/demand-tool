import { NextResponse } from 'next/server';
import { getStudyByCode, getDemandTypeById, getLifecycleStages, getLifecycleStageByCode, setDemandTypeLifecycle } from '@/lib/queries';
import { classifyTypeStage } from '@/lib/ai/classify-lifecycle';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const type = await getDemandTypeById(id);
  if (!type || type.studyId !== study.id) {
    return NextResponse.json({ error: 'Type not found' }, { status: 404 });
  }

  const stages = await getLifecycleStages(study.id);
  if (stages.length === 0) {
    return NextResponse.json({ error: 'No lifecycle stages defined for this study' }, { status: 400 });
  }

  try {
    const result = await classifyTypeStage(type.label, stages.map((s) => s.code));
    let stageId: string | null = null;
    if (result.stageCode) {
      const stage = await getLifecycleStageByCode(study.id, result.stageCode);
      stageId = stage?.id ?? null;
    }
    await setDemandTypeLifecycle(id, stageId, { aiSuggestion: stageId });
    return NextResponse.json({ stageId, ...result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
