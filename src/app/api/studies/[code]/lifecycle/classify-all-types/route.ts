import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { demandTypes, workTypes } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getStudyByCode, getLifecycleStages, setDemandTypeLifecycle, setWorkTypeLifecycle } from '@/lib/queries';
import { classifyTypeStage } from '@/lib/ai/classify-lifecycle';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);
  if (!study) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const stages = await getLifecycleStages(study.id);
  if (stages.length === 0) {
    return NextResponse.json({ error: 'No lifecycle stages defined for this study' }, { status: 400 });
  }
  const stageCodes = stages.map((s) => s.code);
  const stageIdByCode = new Map(stages.map((s) => [s.code, s.id]));

  const body = await request.json().catch(() => ({}));
  const force = body?.force === true;

  const demandTypeList = force
    ? await db.select().from(demandTypes).where(eq(demandTypes.studyId, study.id))
    : await db.select().from(demandTypes).where(and(eq(demandTypes.studyId, study.id), isNull(demandTypes.lifecycleStageId)));
  const workTypeList = force
    ? await db.select().from(workTypes).where(eq(workTypes.studyId, study.id))
    : await db.select().from(workTypes).where(and(eq(workTypes.studyId, study.id), isNull(workTypes.lifecycleStageId)));

  let classified = 0;
  let failed = 0;

  for (const t of demandTypeList) {
    try {
      const result = await classifyTypeStage(t.label, stageCodes);
      const stageId: string | null = result.stageCode ? stageIdByCode.get(result.stageCode) ?? null : null;
      await setDemandTypeLifecycle(t.id, stageId, { aiSuggestion: stageId });
      classified += 1;
    } catch {
      failed += 1;
    }
  }
  for (const t of workTypeList) {
    try {
      const result = await classifyTypeStage(t.label, stageCodes);
      const stageId: string | null = result.stageCode ? stageIdByCode.get(result.stageCode) ?? null : null;
      await setWorkTypeLifecycle(t.id, stageId, { aiSuggestion: stageId });
      classified += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ classified, failed });
}
