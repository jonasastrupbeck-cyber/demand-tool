import { NextResponse } from 'next/server';
import { getStudyByCode, updateStudy, getHandlingTypes, getDemandTypes, getContactMethods, getPointsOfTransaction, getWorkSources, getWhatMattersTypes, getWorkTypes, getWorkStepTypes, getSystemConditions, getThinkings, seedDefaultWorkTypes, getLifecycleStages, seedDefaultLifecycleStages, getLifeProblems, FLOW_PRESET_TOGGLES, getDecisionPointTypes, getDecisionOutcomeTypes, getDecisionCaptureFields, seedDefaultDecisionPointTypes, getMilestones, getSubquestions } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const study = await getStudyByCode(code);

  if (!study) {
    return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  }

  const [hTypes, dTypes, cMethods, potTypes, wSources, wmTypes, wTypes, wsTypes, scTypes, thTypes, lcStages, lpTypes, dpTypes, msTypes, doTypes, dcFields, subqs] = await Promise.all([
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
    getDecisionPointTypes(study.id),
    getMilestones(study.id),
    getDecisionOutcomeTypes(study.id),
    getDecisionCaptureFields(study.id),
    getSubquestions(study.id),
  ]);

  // Decision-box redesign (0042): nest subquestions under their milestone.
  const subqsByMilestone = new Map<string, typeof subqs>();
  for (const sq of subqs) {
    const list = subqsByMilestone.get(sq.milestoneId) ?? [];
    list.push(sq);
    subqsByMilestone.set(sq.milestoneId, list);
  }
  const msTypesWithSubqs = msTypes.map((m) => ({ ...m, subquestions: subqsByMilestone.get(m.id) ?? [] }));

  // Nest each decision point's outcomes under it (ordered) for the UI.
  const outcomesByType = new Map<string, typeof doTypes>();
  for (const o of doTypes) {
    const list = outcomesByType.get(o.decisionPointTypeId) ?? [];
    list.push(o);
    outcomesByType.set(o.decisionPointTypeId, list);
  }
  // Same nesting for capture fields (2026-07-02).
  const fieldsByType = new Map<string, typeof dcFields>();
  for (const f of dcFields) {
    const list = fieldsByType.get(f.decisionPointTypeId) ?? [];
    list.push(f);
    fieldsByType.set(f.decisionPointTypeId, list);
  }
  const dpTypesWithOutcomes = dpTypes.map((d) => ({ ...d, outcomes: outcomesByType.get(d.id) ?? [], captureFields: fieldsByType.get(d.id) ?? [] }));

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
    decisionPointTypes: dpTypesWithOutcomes,
    milestones: msTypesWithSubqs,
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
  // C5 (2026-06-17): flow layout sub-mode (stacked vs wide-screen freeze-pane).
  if (body.flowLayout === 'stacked' || body.flowLayout === 'freeze') updates.flowLayout = body.flowLayout;
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
  // Work-tab classification row gate (migration 0017).
  if (body.workClassificationEnabled !== undefined) updates.workClassificationEnabled = body.workClassificationEnabled;
  if (body.volumeMode !== undefined) updates.volumeMode = body.volumeMode;
  if (body.lifecycleEnabled !== undefined) updates.lifecycleEnabled = body.lifecycleEnabled;
  if (body.classificationEnabled !== undefined) updates.classificationEnabled = body.classificationEnabled;
  if (body.handlingEnabled !== undefined) updates.handlingEnabled = body.handlingEnabled;
  if (body.valueLinkingEnabled !== undefined) updates.valueLinkingEnabled = body.valueLinkingEnabled;
  // Iterative-build toggles (migration 0013).
  if (body.whatMattersEnabled !== undefined) updates.whatMattersEnabled = body.whatMattersEnabled;
  if (body.thinkingsEnabled !== undefined) updates.thinkingsEnabled = body.thinkingsEnabled;
  if (body.lifeProblemsEnabled !== undefined) updates.lifeProblemsEnabled = body.lifeProblemsEnabled;
  // Case stitching toggle (Skipton slice 1, 2026-06-11).
  if (body.caseTrackingEnabled !== undefined) updates.caseTrackingEnabled = body.caseTrackingEnabled;
  // Decision points toggle (Skipton dotted box, 2026-06-12).
  if (body.decisionPointsEnabled !== undefined) updates.decisionPointsEnabled = body.decisionPointsEnabled;
  // Synthesis surface toggle (migration 0028, 2026-06-24).
  if (body.synthesisEnabled !== undefined) updates.synthesisEnabled = body.synthesisEnabled;
  // Flow analytics tab toggle (migration 0029, 2026-06-24).
  if (body.flowAnalyticsEnabled !== undefined) updates.flowAnalyticsEnabled = body.flowAnalyticsEnabled;
  // Flow per-block failure-demand type picker toggle (migration 0033, 2026-06-26).
  if (body.flowFailureDemandTypesEnabled !== undefined) updates.flowFailureDemandTypesEnabled = body.flowFailureDemandTypesEnabled;
  // System type (2026-06-11): layout regime, validated enum. Switching TO
  // 'flow' re-applies the preset ADDITIVELY (turns strands on, never off) and
  // forces caseTrackingEnabled — flow layout is meaningless without cases.
  // Switching to 'transactional' changes only the layout; no toggles touched.
  if (typeof body.systemType === 'string'
      && (body.systemType === 'transactional' || body.systemType === 'flow')) {
    updates.systemType = body.systemType;
    if (body.systemType === 'flow') {
      for (const [key, value] of Object.entries(FLOW_PRESET_TOGGLES)) {
        if (!study[key as keyof typeof FLOW_PRESET_TOGGLES]) updates[key] = value;
      }
    }
  }
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

  // Seed the three decision points when the toggle turns on — keyed off
  // `updates` (not body) so the systemType→flow preset path seeds too.
  // seedDefaultDecisionPointTypes no-ops if the study already has types.
  if (updates.decisionPointsEnabled === true) {
    await seedDefaultDecisionPointTypes(study.id, body.locale || 'en');
  }

  return NextResponse.json({ success: true });
}
