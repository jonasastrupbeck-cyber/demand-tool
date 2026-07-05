import { NextResponse } from 'next/server';
import { getStudyByCode, setEntryLifecycleOverride, getEntryInStudy, getLifecycleStages } from '@/lib/queries';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string; entryId: string }> }
) {
  const { code, entryId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  // Ownership: the entry must belong to this study.
  if (!(await getEntryInStudy(study.id, entryId))) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  const body = await request.json();
  const stageId = body.lifecycleStageId === null || body.lifecycleStageId === '' ? null : body.lifecycleStageId;
  // Validate the stage belongs to this study (else it links foreign data / FK-500).
  if (stageId !== null) {
    const stages = await getLifecycleStages(study.id);
    if (!stages.some((s) => s.id === stageId)) {
      return NextResponse.json({ error: 'Lifecycle stage not found in this study' }, { status: 400 });
    }
  }
  await setEntryLifecycleOverride(entryId, stageId);
  return NextResponse.json({ success: true });
}
