import { NextResponse } from 'next/server';
import { getStudyByCode, setEntryLifecycleOverride } from '@/lib/queries';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string; entryId: string }> }
) {
  const { code, entryId } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const body = await request.json();
  const stageId = body.lifecycleStageId === null || body.lifecycleStageId === '' ? null : body.lifecycleStageId;
  await setEntryLifecycleOverride(entryId, stageId);
  return NextResponse.json({ success: true });
}
