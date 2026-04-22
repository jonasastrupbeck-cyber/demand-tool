import { NextResponse } from 'next/server';
import { getStudyByCode, updateStudy, getHandlingTypes, getDemandTypes, getContactMethods, getPointsOfTransaction, getWorkSources, getWhatMattersTypes, getWorkTypes, getWorkStepTypes, getSystemConditions, getThinkings, seedDefaultWorkTypes, getLifecycleStages, seedDefaultLifecycleStages, getLifeProblems } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const [hTypes, dTypes, cMethods, potTypes, wSources, wmTypes, wTypes, wsTypes, scTypes, thTypes, lcStages, lpTypes] = await Promise.all([
    getHandlingTypes(study.id),
    getDemandTypes(study.id),
    getContactMethods(study.id),
    getPointsOfTransaction(study.id),
    getWorkSources(study.id),
    getWhatMattersTypes(study.id),
    getWorkTypes(study.id),
    getWorkStepTypes(study.id),
    getSystemConditions(study.id),
    getThinkings(study.id),
    getLifecycleStages(study.id),
    getLifeProblems(study.id),
  ]);

  return NextResponse.json({
    ...study,
    handlingTypes: hTypes,
    demandTypes: dTypes,
    contactMethods: cMethods,
    pointsOfTransaction: potTypes,
    workSources: wSources,
    whatMattersTypes: wmTypes,
    workTypes: wTypes,
    workStepTypes: wsTypes,
    systemConditions: scTypes,
    thinkings: thTypes,
    lifecycleStages: lcStages,
    lifeProblems: lpTypes,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.purpose !== undefined) updates.purpose = body.purpose;
  if (body.oneStopHandlingType !== undefined) updates.oneStopHandlingType = body.oneStopHandlingType;
  if (body.workTrackingEnabled !== undefined) updates.workTrackingEnabled = body.workTrackingEnabled;
  if (body.systemConditionsEnabled !== undefined) updates.systemConditionsEnabled = body.systemConditionsEnabled;
  if (body.demandTypesEnabled !== undefined) updates.demandTypesEnabled = body.demandTypesEnabled;
  if (body.workTypesEnabled !== undefined) {
    updates.workTypesEnabled = body.workTypesEnabled;
    // Cascade: enabling "Capture work types" also turns on Work Tracking so the
    // Demand/Work tabs render and dashboard aggregations light up. Disabling it
    // does NOT turn Work Tracking off — that stays user-controlled.
    if (body.workTypesEnabled === true && body.workTrackingEnabled === undefined && !study.workTrackingEnabled) {
      updates.workTrackingEnabled = true;
    }
  }
  if (body.workStepTypesEnabled !== undefined) updates.workStepTypesEnabled = body.workStepTypesEnabled;
  // Flow toggles (migration 0014) — Flow is opt-in per entry-type.
  if (body.flowDemandEnabled !== undefined) updates.flowDemandEnabled = body.flowDemandEnabled;
  if (body.flowWorkEnabled !== undefined) updates.flowWorkEnabled = body.flowWorkEnabled;
  // Work sources toggle (migration 0015) — session-sticky pill on the Work tab.
  if (body.workSourcesEnabled !== undefined) updates.workSourcesEnabled = body.workSourcesEnabled;
  // Work classification preset (migration 0016).
  if (typeof body.workClassificationMode === 'string'
      && (body.workClassificationMode === 'value-sequence-failure-unknown'
       || body.workClassificationMode === 'value-failure-unknown')) {
    updates.workClassificationMode = body.workClassificationMode;
  }
  if (body.volumeMode !== undefined) updates.volumeMode = body.volumeMode;
  if (body.lifecycleEnabled !== undefined) updates.lifecycleEnabled = body.lifecycleEnabled;
  if (body.classificationEnabled !== undefined) updates.classificationEnabled = body.classificationEnabled;
  if (body.handlingEnabled !== undefined) updates.handlingEnabled = body.handlingEnabled;
  if (body.valueLinkingEnabled !== undefined) updates.valueLinkingEnabled = body.valueLinkingEnabled;
  // Iterative-build toggles (migration 0013).
  if (body.whatMattersEnabled !== undefined) updates.whatMattersEnabled = body.whatMattersEnabled;
  if (body.thinkingsEnabled !== undefined) updates.thinkingsEnabled = body.thinkingsEnabled;
  if (body.lifeProblemsEnabled !== undefined) updates.lifeProblemsEnabled = body.lifeProblemsEnabled;
  if (body.consultantPin !== undefined) updates.consultantPin = body.consultantPin;

  // Only call the DB update when we actually have something to set — Drizzle's
  // .set({}) rejects empty objects with "No values to set". A PUT containing
  // only unrecognised fields should be a no-op, not a 500.
  if (Object.keys(updates).length > 0) {
    await updateStudy(study.id, updates);
  }

  // Seed default work types when enabling work tracking for the first time —
  // either via an explicit workTrackingEnabled toggle or via the workTypesEnabled
  // cascade above.
  if (updates.workTrackingEnabled === true) {
    await seedDefaultWorkTypes(study.id, body.locale || 'en');
  }

  // Seed default lifecycle stages when enabling lifecycle for the first time
  if (body.lifecycleEnabled === true) {
    await seedDefaultLifecycleStages(study.id, body.locale || 'en');
  }

  return NextResponse.json({ success: true });
}
