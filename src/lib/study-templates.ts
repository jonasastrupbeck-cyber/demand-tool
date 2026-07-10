// Study templates (migration 0052, 2026-07-04).
//
// A template is a named, FROZEN JSON snapshot of a study's SETTINGS — every
// taxonomy list, the milestone/subquestion structure, and the feature toggles.
// Captured data (entries, cases, answers, work blocks) is never included.
//
// The snapshot keeps the SOURCE study's row ids; applying it to a new study
// generates fresh ids and remaps every internal cross-reference through a
// per-table Map<oldId, newId>. That keeps the blob human-readable and makes
// formula-token rewriting a plain string substitution.

import { db } from './db';
import {
  studies,
  handlingTypes,
  lifecycleStages,
  demandTypes,
  contactMethods,
  pointsOfTransaction,
  workSources,
  whatMattersTypes,
  lifeProblems,
  workTypes,
  workStepTypes,
  valueSteps,
  systemConditions,
  thinkings,
  milestones,
  subquestions,
  subquestionOptions,
  subquestionConditions,
  milestoneDemandTypeConditions,
  milestoneDemandTypeExclusions,
  subquestionDemandTypeExclusions,
  subquestionDemandTypeOptional,
} from './schema';
import { eq, asc, and, isNull, inArray } from 'drizzle-orm';
import { generateId, generateAccessCode } from './utils';

type SubquestionKind = 'amount' | 'number' | 'percent' | 'currency' | 'calculated' | 'date' | 'duration' | 'duration_months' | 'text' | 'choice';

export type StudyTemplateSnapshotV1 = {
  version: 1;
  study: {
    description: string;
    systemType: 'transactional' | 'flow';
    flowLayout: 'stacked' | 'freeze';
    workClassificationMode: 'value-sequence-failure-unknown' | 'value-failure-unknown';
    activeLayer: number;
    // Internal refs (old ids, remapped on apply):
    oneStopHandlingType: string | null;
    primaryContactMethodId: string | null;
    primaryPointOfTransactionId: string | null;
    // Feature toggles, copied verbatim:
    workTrackingEnabled: boolean;
    systemConditionsEnabled: boolean;
    demandTypesEnabled: boolean;
    workTypesEnabled: boolean;
    workStepTypesEnabled: boolean;
    flowDemandEnabled: boolean;
    flowWorkEnabled: boolean;
    workSourcesEnabled: boolean;
    workClassificationEnabled: boolean;
    volumeMode: boolean;
    lifecycleEnabled: boolean;
    classificationEnabled: boolean;
    handlingEnabled: boolean;
    valueLinkingEnabled: boolean;
    whatMattersEnabled: boolean;
    thinkingsEnabled: boolean;
    lifeProblemsEnabled: boolean;
    caseTrackingEnabled: boolean;
    decisionPointsEnabled: boolean;
    synthesisEnabled: boolean;
    flowAnalyticsEnabled: boolean;
    flowFailureDemandTypesEnabled: boolean;
    valueStepsEnabled: boolean;
    valueCreationCapabilityEnabled: boolean;
    brokerChannelEnabled: boolean;
  };
  lifecycleStages: { id: string; code: string; label: string; sortOrder: number }[];
  handlingTypes: { id: string; label: string; operationalDefinition: string | null; customerFacing: boolean; sortOrder: number }[];
  contactMethods: { id: string; label: string; sortOrder: number }[];
  pointsOfTransaction: { id: string; label: string; customerFacing: boolean; sortOrder: number }[];
  workSources: { id: string; label: string; customerFacing: boolean; sortOrder: number }[];
  demandTypes: { id: string; category: 'value' | 'failure'; label: string; operationalDefinition: string | null; sortOrder: number; lifecycleStageId: string | null }[];
  workTypes: { id: string; label: string; category: 'value' | 'failure' | 'sequence'; sortOrder: number; lifecycleStageId: string | null }[];
  workStepTypes: { id: string; label: string; tag: 'value' | 'sequence' | 'failure'; operationalDefinition: string | null; sortOrder: number }[];
  valueSteps: { id: string; label: string; sortOrder: number }[];
  systemConditions: { id: string; label: string; operationalDefinition: string | null; sortOrder: number }[];
  thinkings: { id: string; label: string; operationalDefinition: string | null; sortOrder: number }[];
  lifeProblems: { id: string; label: string; operationalDefinition: string | null; sortOrder: number }[];
  whatMattersTypes: { id: string; label: string; operationalDefinition: string | null; sortOrder: number; timing: 'by_date' | 'asap' | null; anchorEvent: string | null; enabled: boolean; valueKind: 'amount' | 'date_or_duration' | null }[];
  milestones: { id: string; label: string; sortOrder: number }[];
  subquestions: { id: string; milestoneId: string; label: string; kind: SubquestionKind; required: boolean; linkedWhatMattersTypeId: string | null; currencyCode: string | null; formula: string | null; resultFormat: string | null; sortOrder: number }[];
  subquestionOptions: { id: string; subquestionId: string; label: string; polarity: 'positive' | 'negative' | 'concern' | null; sortOrder: number }[];
  subquestionConditions: { subquestionId: string; parentSubquestionId: string; triggerValue: string }[];
  // Dormant include-model (kept for backward-compat with older templates).
  milestoneDemandTypeConditions: { milestoneId: string; demandTypeId: string }[];
  // Live demand-type scoping (0054–0056) — optional so older snapshots parse.
  milestoneDemandTypeExclusions?: { milestoneId: string; demandTypeId: string }[];
  subquestionDemandTypeExclusions?: { subquestionId: string; demandTypeId: string }[];
  subquestionDemandTypeOptional?: { subquestionId: string; demandTypeId: string }[];
};

export function parseSnapshot(text: string): StudyTemplateSnapshotV1 {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.version !== 1) {
    throw new Error(`Unsupported template snapshot version: ${parsed?.version}`);
  }
  return parsed as StudyTemplateSnapshotV1;
}

export async function snapshotStudySettings(studyId: string): Promise<StudyTemplateSnapshotV1> {
  const [study] = await db.select().from(studies).where(eq(studies.id, studyId));
  if (!study) throw new Error('Study not found');

  const stages = await db.select().from(lifecycleStages).where(eq(lifecycleStages.studyId, studyId)).orderBy(asc(lifecycleStages.sortOrder));
  const handling = await db.select().from(handlingTypes).where(eq(handlingTypes.studyId, studyId)).orderBy(asc(handlingTypes.sortOrder));
  const cms = await db.select().from(contactMethods).where(eq(contactMethods.studyId, studyId)).orderBy(asc(contactMethods.sortOrder));
  const pots = await db.select().from(pointsOfTransaction).where(eq(pointsOfTransaction.studyId, studyId)).orderBy(asc(pointsOfTransaction.sortOrder));
  const wss = await db.select().from(workSources).where(eq(workSources.studyId, studyId)).orderBy(asc(workSources.sortOrder));
  const dts = await db.select().from(demandTypes).where(eq(demandTypes.studyId, studyId)).orderBy(asc(demandTypes.sortOrder));
  // Synthesis-archived rows are history, not settings — a new study starts
  // with only the live (merged/renamed) set.
  const wts = await db.select().from(workTypes).where(and(eq(workTypes.studyId, studyId), isNull(workTypes.archivedAt))).orderBy(asc(workTypes.sortOrder));
  const wsts = await db.select().from(workStepTypes).where(and(eq(workStepTypes.studyId, studyId), isNull(workStepTypes.archivedAt))).orderBy(asc(workStepTypes.sortOrder));
  const vsteps = await db.select().from(valueSteps).where(eq(valueSteps.studyId, studyId)).orderBy(asc(valueSteps.sortOrder));
  const scs = await db.select().from(systemConditions).where(and(eq(systemConditions.studyId, studyId), isNull(systemConditions.archivedAt))).orderBy(asc(systemConditions.sortOrder));
  const thks = await db.select().from(thinkings).where(eq(thinkings.studyId, studyId)).orderBy(asc(thinkings.sortOrder));
  const lps = await db.select().from(lifeProblems).where(eq(lifeProblems.studyId, studyId)).orderBy(asc(lifeProblems.sortOrder));
  const wms = await db.select().from(whatMattersTypes).where(eq(whatMattersTypes.studyId, studyId)).orderBy(asc(whatMattersTypes.sortOrder));
  const mss = await db.select().from(milestones).where(eq(milestones.studyId, studyId)).orderBy(asc(milestones.sortOrder));
  const msIds = mss.map((m) => m.id);
  const sqs = msIds.length > 0
    ? await db.select().from(subquestions).where(inArray(subquestions.milestoneId, msIds)).orderBy(asc(subquestions.sortOrder))
    : [];
  const sqIds = sqs.map((s) => s.id);
  const opts = sqIds.length > 0
    ? await db.select().from(subquestionOptions).where(inArray(subquestionOptions.subquestionId, sqIds)).orderBy(asc(subquestionOptions.sortOrder))
    : [];
  const conds = sqIds.length > 0
    ? await db.select().from(subquestionConditions).where(inArray(subquestionConditions.subquestionId, sqIds))
    : [];
  const msDtConds = msIds.length > 0
    ? await db.select().from(milestoneDemandTypeConditions).where(inArray(milestoneDemandTypeConditions.milestoneId, msIds))
    : [];
  // Live demand-type scoping (0054–0056): the runtime reads these, not the
  // dormant include table above — without them a templated study loses all
  // per-question/milestone exclude + not-mandatory rules.
  const msDtExcl = msIds.length > 0
    ? await db.select().from(milestoneDemandTypeExclusions).where(inArray(milestoneDemandTypeExclusions.milestoneId, msIds))
    : [];
  const sqDtExcl = sqIds.length > 0
    ? await db.select().from(subquestionDemandTypeExclusions).where(inArray(subquestionDemandTypeExclusions.subquestionId, sqIds))
    : [];
  const sqDtOpt = sqIds.length > 0
    ? await db.select().from(subquestionDemandTypeOptional).where(inArray(subquestionDemandTypeOptional.subquestionId, sqIds))
    : [];

  return {
    version: 1,
    study: {
      description: study.description ?? '',
      // purpose deliberately NOT copied — a new study writes its own (Jonas 2026-07-04).
      systemType: study.systemType,
      flowLayout: study.flowLayout,
      workClassificationMode: study.workClassificationMode,
      activeLayer: study.activeLayer,
      oneStopHandlingType: study.oneStopHandlingType,
      primaryContactMethodId: study.primaryContactMethodId,
      primaryPointOfTransactionId: study.primaryPointOfTransactionId,
      workTrackingEnabled: study.workTrackingEnabled,
      systemConditionsEnabled: study.systemConditionsEnabled,
      demandTypesEnabled: study.demandTypesEnabled,
      workTypesEnabled: study.workTypesEnabled,
      workStepTypesEnabled: study.workStepTypesEnabled,
      flowDemandEnabled: study.flowDemandEnabled,
      flowWorkEnabled: study.flowWorkEnabled,
      workSourcesEnabled: study.workSourcesEnabled,
      workClassificationEnabled: study.workClassificationEnabled,
      volumeMode: study.volumeMode,
      lifecycleEnabled: study.lifecycleEnabled,
      classificationEnabled: study.classificationEnabled,
      handlingEnabled: study.handlingEnabled,
      valueLinkingEnabled: study.valueLinkingEnabled,
      whatMattersEnabled: study.whatMattersEnabled,
      thinkingsEnabled: study.thinkingsEnabled,
      lifeProblemsEnabled: study.lifeProblemsEnabled,
      caseTrackingEnabled: study.caseTrackingEnabled,
      decisionPointsEnabled: study.decisionPointsEnabled,
      synthesisEnabled: study.synthesisEnabled,
      flowAnalyticsEnabled: study.flowAnalyticsEnabled,
      flowFailureDemandTypesEnabled: study.flowFailureDemandTypesEnabled,
      valueStepsEnabled: study.valueStepsEnabled,
      valueCreationCapabilityEnabled: study.valueCreationCapabilityEnabled,
      brokerChannelEnabled: study.brokerChannelEnabled,
    },
    lifecycleStages: stages.map((s) => ({ id: s.id, code: s.code, label: s.label, sortOrder: s.sortOrder })),
    handlingTypes: handling.map((h) => ({ id: h.id, label: h.label, operationalDefinition: h.operationalDefinition, customerFacing: h.customerFacing, sortOrder: h.sortOrder })),
    contactMethods: cms.map((c) => ({ id: c.id, label: c.label, sortOrder: c.sortOrder })),
    pointsOfTransaction: pots.map((p) => ({ id: p.id, label: p.label, customerFacing: p.customerFacing, sortOrder: p.sortOrder })),
    workSources: wss.map((w) => ({ id: w.id, label: w.label, customerFacing: w.customerFacing, sortOrder: w.sortOrder })),
    // lifecycleAiSuggestion / lifecycleClassifiedAt are per-study AI-derived
    // data, not settings — dropped here.
    demandTypes: dts.map((d) => ({ id: d.id, category: d.category, label: d.label, operationalDefinition: d.operationalDefinition, sortOrder: d.sortOrder, lifecycleStageId: d.lifecycleStageId })),
    workTypes: wts.map((w) => ({ id: w.id, label: w.label, category: w.category, sortOrder: w.sortOrder, lifecycleStageId: w.lifecycleStageId })),
    workStepTypes: wsts.map((w) => ({ id: w.id, label: w.label, tag: w.tag, operationalDefinition: w.operationalDefinition, sortOrder: w.sortOrder })),
    valueSteps: vsteps.map((v) => ({ id: v.id, label: v.label, sortOrder: v.sortOrder })),
    systemConditions: scs.map((s) => ({ id: s.id, label: s.label, operationalDefinition: s.operationalDefinition, sortOrder: s.sortOrder })),
    thinkings: thks.map((t) => ({ id: t.id, label: t.label, operationalDefinition: t.operationalDefinition, sortOrder: t.sortOrder })),
    lifeProblems: lps.map((l) => ({ id: l.id, label: l.label, operationalDefinition: l.operationalDefinition, sortOrder: l.sortOrder })),
    whatMattersTypes: wms.map((w) => ({
      id: w.id,
      label: w.label,
      operationalDefinition: w.operationalDefinition,
      sortOrder: w.sortOrder,
      timing: w.timing,
      // Fold the legacy milestone-only column into the token form the UI
      // itself falls back to (settings page reads anchorEvent ?? anchorMilestoneId).
      anchorEvent: w.anchorEvent ?? (w.anchorMilestoneId ? `milestone:${w.anchorMilestoneId}` : null),
      enabled: w.enabled,
      valueKind: w.valueKind,
    })),
    milestones: mss.map((m) => ({ id: m.id, label: m.label, sortOrder: m.sortOrder })),
    // migratedFromFieldId is 0042-backfill provenance, not a setting — dropped.
    subquestions: sqs.map((s) => ({ id: s.id, milestoneId: s.milestoneId, label: s.label, kind: s.kind, required: s.required, linkedWhatMattersTypeId: s.linkedWhatMattersTypeId, currencyCode: s.currencyCode, formula: s.formula, resultFormat: s.resultFormat, sortOrder: s.sortOrder })),
    subquestionOptions: opts.map((o) => ({ id: o.id, subquestionId: o.subquestionId, label: o.label, polarity: o.polarity, sortOrder: o.sortOrder })),
    subquestionConditions: conds.map((c) => ({ subquestionId: c.subquestionId, parentSubquestionId: c.parentSubquestionId, triggerValue: c.triggerValue })),
    milestoneDemandTypeConditions: msDtConds.map((c) => ({ milestoneId: c.milestoneId, demandTypeId: c.demandTypeId })),
    milestoneDemandTypeExclusions: msDtExcl.map((c) => ({ milestoneId: c.milestoneId, demandTypeId: c.demandTypeId })),
    subquestionDemandTypeExclusions: sqDtExcl.map((c) => ({ subquestionId: c.subquestionId, demandTypeId: c.demandTypeId })),
    subquestionDemandTypeOptional: sqDtOpt.map((c) => ({ subquestionId: c.subquestionId, demandTypeId: c.demandTypeId })),
  };
}

// Builds a fresh study from a snapshot. Never calls createStudy — the snapshot
// already contains everything a study should start with, so none of the default
// seeding (handling types, demand types, contact methods, flow milestones,
// standard what-matters types) may run.
export async function createStudyFromTemplate(params: {
  name: string;
  description?: string;
  consultantPin?: string;
  snapshot: StudyTemplateSnapshotV1;
}): Promise<{ id: string; accessCode: string }> {
  const { name, description, consultantPin, snapshot } = params;
  const s = snapshot.study;

  const id = generateId();
  let accessCode = generateAccessCode();
  const existing = await db.select().from(studies).where(eq(studies.accessCode, accessCode));
  if (existing.length > 0) {
    accessCode = generateAccessCode();
  }

  // 1. Bare studies row — internal refs (one-stop / primary CM / primary PoT)
  // are set in step 3 once their new ids exist.
  await db.insert(studies).values({
    id,
    accessCode,
    name,
    description: description?.trim() || s.description,
    purpose: '',
    consultantPin: consultantPin || null,
    createdAt: new Date(),
    isActive: true,
    systemType: s.systemType,
    flowLayout: s.flowLayout,
    workClassificationMode: s.workClassificationMode,
    activeLayer: s.activeLayer,
    workTrackingEnabled: s.workTrackingEnabled,
    systemConditionsEnabled: s.systemConditionsEnabled,
    demandTypesEnabled: s.demandTypesEnabled,
    workTypesEnabled: s.workTypesEnabled,
    workStepTypesEnabled: s.workStepTypesEnabled,
    flowDemandEnabled: s.flowDemandEnabled,
    flowWorkEnabled: s.flowWorkEnabled,
    workSourcesEnabled: s.workSourcesEnabled,
    workClassificationEnabled: s.workClassificationEnabled,
    volumeMode: s.volumeMode,
    lifecycleEnabled: s.lifecycleEnabled,
    classificationEnabled: s.classificationEnabled,
    handlingEnabled: s.handlingEnabled,
    valueLinkingEnabled: s.valueLinkingEnabled,
    whatMattersEnabled: s.whatMattersEnabled,
    thinkingsEnabled: s.thinkingsEnabled,
    lifeProblemsEnabled: s.lifeProblemsEnabled,
    caseTrackingEnabled: s.caseTrackingEnabled,
    decisionPointsEnabled: s.decisionPointsEnabled,
    synthesisEnabled: s.synthesisEnabled,
    flowAnalyticsEnabled: s.flowAnalyticsEnabled,
    flowFailureDemandTypesEnabled: s.flowFailureDemandTypesEnabled,
    valueStepsEnabled: s.valueStepsEnabled,
    valueCreationCapabilityEnabled: s.valueCreationCapabilityEnabled,
    brokerChannelEnabled: s.brokerChannelEnabled,
  });

  // 2. Settings lists, in FK-safe order, each row a fresh id recorded in a map.
  const newIds = (rows: { id: string }[]) => {
    const map = new Map<string, string>();
    for (const row of rows) map.set(row.id, generateId());
    return map;
  };

  const stageMap = newIds(snapshot.lifecycleStages);
  if (snapshot.lifecycleStages.length > 0) {
    await db.insert(lifecycleStages).values(snapshot.lifecycleStages.map((r) => ({
      id: stageMap.get(r.id)!, studyId: id, code: r.code, label: r.label, sortOrder: r.sortOrder,
    })));
  }

  const handlingMap = newIds(snapshot.handlingTypes);
  if (snapshot.handlingTypes.length > 0) {
    await db.insert(handlingTypes).values(snapshot.handlingTypes.map((r) => ({
      id: handlingMap.get(r.id)!, studyId: id, label: r.label, operationalDefinition: r.operationalDefinition, customerFacing: r.customerFacing, sortOrder: r.sortOrder,
    })));
  }

  const cmMap = newIds(snapshot.contactMethods);
  if (snapshot.contactMethods.length > 0) {
    await db.insert(contactMethods).values(snapshot.contactMethods.map((r) => ({
      id: cmMap.get(r.id)!, studyId: id, label: r.label, sortOrder: r.sortOrder,
    })));
  }

  const potMap = newIds(snapshot.pointsOfTransaction);
  if (snapshot.pointsOfTransaction.length > 0) {
    await db.insert(pointsOfTransaction).values(snapshot.pointsOfTransaction.map((r) => ({
      id: potMap.get(r.id)!, studyId: id, label: r.label, customerFacing: r.customerFacing, sortOrder: r.sortOrder,
    })));
  }

  if (snapshot.workSources.length > 0) {
    await db.insert(workSources).values(snapshot.workSources.map((r) => ({
      id: generateId(), studyId: id, label: r.label, customerFacing: r.customerFacing, sortOrder: r.sortOrder,
    })));
  }

  if (snapshot.systemConditions.length > 0) {
    await db.insert(systemConditions).values(snapshot.systemConditions.map((r) => ({
      id: generateId(), studyId: id, label: r.label, operationalDefinition: r.operationalDefinition, sortOrder: r.sortOrder,
    })));
  }

  if (snapshot.thinkings.length > 0) {
    await db.insert(thinkings).values(snapshot.thinkings.map((r) => ({
      id: generateId(), studyId: id, label: r.label, operationalDefinition: r.operationalDefinition, sortOrder: r.sortOrder,
    })));
  }

  if (snapshot.lifeProblems.length > 0) {
    await db.insert(lifeProblems).values(snapshot.lifeProblems.map((r) => ({
      id: generateId(), studyId: id, label: r.label, operationalDefinition: r.operationalDefinition, sortOrder: r.sortOrder,
    })));
  }

  if (snapshot.valueSteps.length > 0) {
    await db.insert(valueSteps).values(snapshot.valueSteps.map((r) => ({
      id: generateId(), studyId: id, label: r.label, sortOrder: r.sortOrder,
    })));
  }

  if (snapshot.workStepTypes.length > 0) {
    await db.insert(workStepTypes).values(snapshot.workStepTypes.map((r) => ({
      id: generateId(), studyId: id, label: r.label, tag: r.tag, operationalDefinition: r.operationalDefinition, sortOrder: r.sortOrder,
    })));
  }

  const demandTypeMap = newIds(snapshot.demandTypes);
  if (snapshot.demandTypes.length > 0) {
    await db.insert(demandTypes).values(snapshot.demandTypes.map((r) => ({
      id: demandTypeMap.get(r.id)!, studyId: id, category: r.category, label: r.label, operationalDefinition: r.operationalDefinition, sortOrder: r.sortOrder,
      lifecycleStageId: r.lifecycleStageId ? stageMap.get(r.lifecycleStageId) ?? null : null,
    })));
  }

  if (snapshot.workTypes.length > 0) {
    await db.insert(workTypes).values(snapshot.workTypes.map((r) => ({
      id: generateId(), studyId: id, label: r.label, category: r.category, sortOrder: r.sortOrder,
      lifecycleStageId: r.lifecycleStageId ? stageMap.get(r.lifecycleStageId) ?? null : null,
    })));
  }

  const milestoneMap = newIds(snapshot.milestones);
  if (snapshot.milestones.length > 0) {
    await db.insert(milestones).values(snapshot.milestones.map((r) => ({
      id: milestoneMap.get(r.id)!, studyId: id, label: r.label, sortOrder: r.sortOrder,
    })));
  }

  const wmMap = newIds(snapshot.whatMattersTypes);
  if (snapshot.whatMattersTypes.length > 0) {
    await db.insert(whatMattersTypes).values(snapshot.whatMattersTypes.map((r) => {
      // anchorEvent tokens: 'milestone:<id>' remaps; legacy 'decision:<id>'
      // (decision layer dropped in 0046) is unmappable → null.
      let anchorEvent: string | null = null;
      if (r.anchorEvent?.startsWith('milestone:')) {
        const target = milestoneMap.get(r.anchorEvent.slice('milestone:'.length));
        anchorEvent = target ? `milestone:${target}` : null;
      }
      return {
        id: wmMap.get(r.id)!, studyId: id, label: r.label, operationalDefinition: r.operationalDefinition, sortOrder: r.sortOrder,
        timing: r.timing, anchorEvent, enabled: r.enabled, valueKind: r.valueKind,
      };
    }));
  }

  const sqMap = newIds(snapshot.subquestions);
  if (snapshot.subquestions.length > 0) {
    await db.insert(subquestions).values(snapshot.subquestions.map((r) => {
      // Rewrite {sq:<oldId>} formula tokens to the new sibling ids; a token
      // that doesn't resolve (stale ref in the source study) voids the formula
      // rather than leaving a dangling reference.
      let formula = r.formula;
      if (formula) {
        let broken = false;
        formula = formula.replace(/\{sq:([^}]+)\}/g, (_m, oldId: string) => {
          const mapped = sqMap.get(oldId);
          if (!mapped) { broken = true; return _m; }
          return `{sq:${mapped}}`;
        });
        if (broken) formula = null;
      }
      return {
        id: sqMap.get(r.id)!,
        milestoneId: milestoneMap.get(r.milestoneId)!,
        label: r.label,
        kind: r.kind,
        required: r.required,
        linkedWhatMattersTypeId: r.linkedWhatMattersTypeId ? wmMap.get(r.linkedWhatMattersTypeId) ?? null : null,
        currencyCode: r.currencyCode,
        formula,
        resultFormat: r.resultFormat ?? null,
        sortOrder: r.sortOrder,
      };
    }));
  }

  if (snapshot.subquestionOptions.length > 0) {
    await db.insert(subquestionOptions).values(snapshot.subquestionOptions.map((r) => ({
      id: generateId(), subquestionId: sqMap.get(r.subquestionId)!, label: r.label, polarity: r.polarity, sortOrder: r.sortOrder,
    })));
  }

  if (snapshot.subquestionConditions.length > 0) {
    await db.insert(subquestionConditions).values(snapshot.subquestionConditions.map((r) => ({
      // triggerValue matches on the option LABEL (see answersSubquestion match
      // in queries.ts), so it copies verbatim — only the two FKs remap.
      id: generateId(), subquestionId: sqMap.get(r.subquestionId)!, parentSubquestionId: sqMap.get(r.parentSubquestionId)!, triggerValue: r.triggerValue,
    })));
  }

  if (snapshot.milestoneDemandTypeConditions.length > 0) {
    await db.insert(milestoneDemandTypeConditions).values(snapshot.milestoneDemandTypeConditions.map((r) => ({
      id: generateId(), milestoneId: milestoneMap.get(r.milestoneId)!, demandTypeId: demandTypeMap.get(r.demandTypeId)!,
    })));
  }

  // Live demand-type scoping (0054–0056). Guarded with ?? [] so older snapshots
  // (made before this was added) still apply. Drop any row whose milestone/
  // subquestion/demand-type didn't map (defensive; all should map).
  const msDtExclRows = (snapshot.milestoneDemandTypeExclusions ?? [])
    .map((r) => ({ id: generateId(), milestoneId: milestoneMap.get(r.milestoneId), demandTypeId: demandTypeMap.get(r.demandTypeId) }))
    .filter((r) => r.milestoneId && r.demandTypeId) as { id: string; milestoneId: string; demandTypeId: string }[];
  if (msDtExclRows.length > 0) await db.insert(milestoneDemandTypeExclusions).values(msDtExclRows);

  const sqDtExclRows = (snapshot.subquestionDemandTypeExclusions ?? [])
    .map((r) => ({ id: generateId(), subquestionId: sqMap.get(r.subquestionId), demandTypeId: demandTypeMap.get(r.demandTypeId) }))
    .filter((r) => r.subquestionId && r.demandTypeId) as { id: string; subquestionId: string; demandTypeId: string }[];
  if (sqDtExclRows.length > 0) await db.insert(subquestionDemandTypeExclusions).values(sqDtExclRows);

  const sqDtOptRows = (snapshot.subquestionDemandTypeOptional ?? [])
    .map((r) => ({ id: generateId(), subquestionId: sqMap.get(r.subquestionId), demandTypeId: demandTypeMap.get(r.demandTypeId) }))
    .filter((r) => r.subquestionId && r.demandTypeId) as { id: string; subquestionId: string; demandTypeId: string }[];
  if (sqDtOptRows.length > 0) await db.insert(subquestionDemandTypeOptional).values(sqDtOptRows);

  // 3. Internal refs on the studies row, now that their targets exist.
  await db.update(studies).set({
    oneStopHandlingType: s.oneStopHandlingType ? handlingMap.get(s.oneStopHandlingType) ?? null : null,
    primaryContactMethodId: s.primaryContactMethodId ? cmMap.get(s.primaryContactMethodId) ?? null : null,
    primaryPointOfTransactionId: s.primaryPointOfTransactionId ? potMap.get(s.primaryPointOfTransactionId) ?? null : null,
  }).where(eq(studies.id, id));

  return { id, accessCode };
}
