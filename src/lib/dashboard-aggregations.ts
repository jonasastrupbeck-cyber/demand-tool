import { db } from './db';
import { demandEntries, handlingTypes, demandTypes, contactMethods, pointsOfTransaction, whatMattersTypes, workTypes, workStepTypes, valueSteps, workDescriptionBlocks, workBlockSystemConditions, studies, demandEntryWhatMatters, systemConditions, demandEntrySystemConditions, lifecycleStages, lifeProblems, cases, caseDemandTypes, caseMilestones, caseWhatMatters, capabilityAnnotations, milestones, subquestions, caseSubquestionAnswers } from './schema';
import { askVerdict } from './ask-verdict';
import { eq, and, or, sql, gte, lte, desc, inArray, isNotNull, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { DashboardData, CapabilityData, BudgetCapabilityField, BudgetCapabilityPoint } from '@/types';
import type { SQL } from 'drizzle-orm';

// Value-demand scope (2026-07-08): the flow dashboard filters by VALUE DEMAND
// (a demand_types row, category='value') instead of life problem. A case's value
// demand(s) live on cases.demandTypeId (primary) + the caseDemandTypes junction
// (a case may have several), so resolve the matching case ids and scope entries /
// the case set by them. Multi-select: match cases whose value-demand set intersects
// ANY selected id. Empty selection = no filter ("All"). Selected-but-no-match must
// show ZERO (guarded with sql`false` at the call sites), never "all".
export async function valueDemandCaseIds(studyId: string, ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const rows = await db.selectDistinct({ id: cases.id })
    .from(cases)
    .leftJoin(caseDemandTypes, eq(caseDemandTypes.caseId, cases.id))
    .where(and(eq(cases.studyId, studyId), or(inArray(cases.demandTypeId, ids), inArray(caseDemandTypes.demandTypeId, ids))));
  return rows.map((r) => r.id);
}

// Case-set scope predicate for value-demand-filtered case queries. Absent filter →
// study only; selected-but-no-match → sql`false` (zero cases).
async function valueDemandCaseWhere(studyId: string, valueDemands?: string[]): Promise<SQL> {
  if (!valueDemands || !valueDemands.length) return eq(cases.studyId, studyId);
  const caseIds = await valueDemandCaseIds(studyId, valueDemands);
  return caseIds.length ? and(eq(cases.studyId, studyId), inArray(cases.id, caseIds))! : sql`false`;
}

export async function getDashboardData(studyId: string, from?: Date, to?: Date, valueDemands?: string[]): Promise<DashboardData> {
  const baseConditions = [eq(demandEntries.studyId, studyId)];
  if (from) baseConditions.push(gte(demandEntries.createdAt, from));
  if (to) baseConditions.push(lte(demandEntries.createdAt, to));

  // Value-demand scope (flow: value demand lives on the case; entries carry
  // caseId). Cascades into demandWhere + workWhere below, so every aggregation is
  // scoped. Selected-but-no-match → sql`false` (show zero, never "all").
  if (valueDemands && valueDemands.length) {
    const caseIds = await valueDemandCaseIds(studyId, valueDemands);
    baseConditions.push(caseIds.length ? inArray(demandEntries.caseId, caseIds) : sql`false`);
  }

  // Demand-only conditions (filter out work entries from all existing queries)
  const demandConditions = [...baseConditions, eq(demandEntries.entryType, 'demand')];
  const demandWhere = and(...demandConditions);

  // Work-only conditions
  const workConditions = [...baseConditions, eq(demandEntries.entryType, 'work')];
  const workWhere = and(...workConditions);

  // Get study for one-stop handling type and work tracking flag
  const study = await db.select().from(studies).where(eq(studies.id, studyId));
  const oneStopId = study[0]?.oneStopHandlingType;
  const workTrackingEnabled = study[0]?.workTrackingEnabled ?? false;
  const workStepTypesEnabled = study[0]?.workStepTypesEnabled ?? false;
  const systemConditionsEnabled = study[0]?.systemConditionsEnabled ?? false;
  const lifecycleEnabled = study[0]?.lifecycleEnabled ?? false;
  const flowFailureDemandTypesEnabled = study[0]?.flowFailureDemandTypesEnabled ?? false;
  const valueStepsEnabled = study[0]?.valueStepsEnabled ?? false;

  // ── DEMAND AGGREGATIONS ──
  //
  // Perf (2026-04-21): the ~10 independent demand queries are parallelised via
  // Promise.all. Previously each awaited sequentially — dashboard load was
  // ~1.4 s on a ~120-entry study. Running them in parallel cuts that to roughly
  // the slowest-single-query time. Post-processing (map reductions) stays
  // sequential but is purely in-memory and fast.
  const [
    classificationCounts,
    demandTypeCounts,
    handlingTypeCounts,
    contactMethodCounts,
    lifeProblemCounts,
    whatMattersCounts,
    wmByClass,
  ] = await Promise.all([
    // Total counts by classification (demand only)
    db.select({
      classification: demandEntries.classification,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .where(demandWhere)
      .groupBy(demandEntries.classification),

    // Demand type counts (top 10)
    db.select({
      label: demandTypes.label,
      category: demandTypes.category,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(demandTypes, eq(demandEntries.demandTypeId, demandTypes.id))
      .where(demandWhere)
      .groupBy(demandTypes.label, demandTypes.category)
      .orderBy(desc(sql`count(*)`))
      .limit(10),

    // Handling type counts (demand only)
    db.select({
      label: handlingTypes.label,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(handlingTypes, eq(demandEntries.handlingTypeId, handlingTypes.id))
      .where(demandWhere)
      .groupBy(handlingTypes.label)
      .orderBy(desc(sql`count(*)`)),

    // Contact method counts (demand only)
    db.select({
      label: contactMethods.label,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(contactMethods, eq(demandEntries.contactMethodId, contactMethods.id))
      .where(demandWhere)
      .groupBy(contactMethods.label)
      .orderBy(desc(sql`count(*)`)),

    // Life problem counts (demand only) — Phase 3
    db.select({
      label: lifeProblems.label,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(lifeProblems, eq(demandEntries.lifeProblemId, lifeProblems.id))
      .where(demandWhere)
      .groupBy(lifeProblems.label)
      .orderBy(desc(sql`count(*)`)),

    // What matters type counts (demand only, via junction table)
    db.select({
      label: whatMattersTypes.label,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntryWhatMatters)
      .innerJoin(whatMattersTypes, eq(demandEntryWhatMatters.whatMattersTypeId, whatMattersTypes.id))
      .innerJoin(demandEntries, eq(demandEntryWhatMatters.demandEntryId, demandEntries.id))
      .where(demandWhere)
      .groupBy(whatMattersTypes.label)
      .orderBy(desc(sql`count(*)`)),

    // What matters by classification (demand only, for Layer 5)
    db.select({
      label: whatMattersTypes.label,
      classification: demandEntries.classification,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntryWhatMatters)
      .innerJoin(whatMattersTypes, eq(demandEntryWhatMatters.whatMattersTypeId, whatMattersTypes.id))
      .innerJoin(demandEntries, eq(demandEntryWhatMatters.demandEntryId, demandEntries.id))
      .where(demandWhere)
      .groupBy(whatMattersTypes.label, demandEntries.classification),
  ]);

  const valueCount = classificationCounts.find(c => c.classification === 'value')?.count || 0;
  const failureCount = classificationCounts.find(c => c.classification === 'failure')?.count || 0;
  const unknownCount = classificationCounts.find(c => c.classification === 'unknown')?.count || 0;
  const totalEntries = valueCount + failureCount + unknownCount;

  // Perfect percentage: value demand with one-stop handling as % of total demand.
  // Depends on totalEntries from classificationCounts above, so stays sequential.
  let perfectPercentage = 0;
  if (oneStopId && totalEntries > 0) {
    const perfectCount = await db.select({
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .where(and(
        ...demandConditions,
        eq(demandEntries.classification, 'value'),
        eq(demandEntries.handlingTypeId, oneStopId)
      ));
    perfectPercentage = Math.round((perfectCount[0].count / totalEntries) * 100);
  }

  const wmClassMap = new Map<string, { valueCount: number; failureCount: number }>();
  for (const row of wmByClass) {
    if (!wmClassMap.has(row.label)) {
      wmClassMap.set(row.label, { valueCount: 0, failureCount: 0 });
    }
    const entry = wmClassMap.get(row.label)!;
    if (row.classification === 'value') entry.valueCount = row.count;
    else if (row.classification === 'failure') entry.failureCount = row.count;
  }
  const whatMattersByClassification = Array.from(wmClassMap.entries()).map(([label, counts]) => ({
    label,
    ...counts,
  }));

  // Second parallel batch — all independent of each other and of the first batch
  // (apart from the `perfectPercentage` sequence above, which had to run first).
  const allWhere = and(...baseConditions);
  const [
    handlingByClass,
    demandOverTime,
    failureCausesRaw,
    helpingConditionsRaw,
    failuresByOriginalValueDemand,
    failureFlowLinksRaw,
    potByClass,
    whatMattersNotesRaw,
    collectorStats,
  ] = await Promise.all([
    // Handling by classification (demand only)
    db.select({
      label: handlingTypes.label,
      classification: demandEntries.classification,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(handlingTypes, eq(demandEntries.handlingTypeId, handlingTypes.id))
      .where(demandWhere)
      .groupBy(handlingTypes.label, demandEntries.classification),

    // Demand over time (demand only)
    db.select({
      date: sql<string>`${demandEntries.createdAt}::date`,
      classification: demandEntries.classification,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .where(demandWhere)
      .groupBy(sql`${demandEntries.createdAt}::date`, demandEntries.classification)
      .orderBy(sql`${demandEntries.createdAt}::date`),

    // Failure causes / system conditions (demand only).
    // Managed-SC branch or free-text branch, decided once up front.
    systemConditionsEnabled
      ? db.select({
          cause: systemConditions.label,
          count: sql<number>`count(*)::int`,
        })
          .from(demandEntrySystemConditions)
          .innerJoin(systemConditions, eq(demandEntrySystemConditions.systemConditionId, systemConditions.id))
          .innerJoin(demandEntries, eq(demandEntrySystemConditions.demandEntryId, demandEntries.id))
          .where(and(
            ...demandConditions,
            eq(demandEntries.classification, 'failure'),
            eq(demandEntrySystemConditions.dimension, 'hinders'),
          ))
          .groupBy(systemConditions.label)
          .orderBy(desc(sql`count(*)`))
          .limit(15)
      : db.select({
          cause: demandEntries.failureCause,
          count: sql<number>`count(*)::int`,
        })
          .from(demandEntries)
          .where(and(
            ...demandConditions,
            eq(demandEntries.classification, 'failure'),
            sql`${demandEntries.failureCause} IS NOT NULL AND ${demandEntries.failureCause} != ''`
          ))
          .groupBy(demandEntries.failureCause)
          .orderBy(desc(sql`count(*)`))
          .limit(15),

    // Helping conditions (Phase 3) — empty array when managed SC is disabled.
    systemConditionsEnabled
      ? db.select({
          cause: systemConditions.label,
          count: sql<number>`count(*)::int`,
        })
          .from(demandEntrySystemConditions)
          .innerJoin(systemConditions, eq(demandEntrySystemConditions.systemConditionId, systemConditions.id))
          .innerJoin(demandEntries, eq(demandEntrySystemConditions.demandEntryId, demandEntries.id))
          .where(and(
            eq(demandEntries.studyId, studyId),
            ...(from ? [gte(demandEntries.createdAt, from)] : []),
            ...(to ? [lte(demandEntries.createdAt, to)] : []),
            eq(demandEntrySystemConditions.dimension, 'helps'),
          ))
          .groupBy(systemConditions.label)
          .orderBy(desc(sql`count(*)`))
          .limit(15)
      : Promise.resolve([] as Array<{ cause: string | null; count: number }>),

    // Failures by original value demand type (demand only)
    db.select({
      label: demandTypes.label,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(demandTypes, eq(demandEntries.originalValueDemandTypeId, demandTypes.id))
      .where(and(
        ...demandConditions,
        eq(demandEntries.classification, 'failure'),
      ))
      .groupBy(demandTypes.label)
      .orderBy(desc(sql`count(*)`)),

    // Failure flow: value demand type → failure demand type cross-tabulation
    (() => {
      const originalDemandType = alias(demandTypes, 'originalDemandType');
      const failureDemandType = alias(demandTypes, 'failureDemandType');
      return db.select({
        sourceLabel: originalDemandType.label,
        targetLabel: failureDemandType.label,
        count: sql<number>`count(*)::int`,
      })
        .from(demandEntries)
        .innerJoin(originalDemandType, eq(demandEntries.originalValueDemandTypeId, originalDemandType.id))
        .innerJoin(failureDemandType, eq(demandEntries.demandTypeId, failureDemandType.id))
        .where(and(
          ...demandConditions,
          eq(demandEntries.classification, 'failure'),
        ))
        .groupBy(originalDemandType.label, failureDemandType.label)
        .orderBy(desc(sql`count(*)`));
    })(),

    // Point of transaction by classification (demand only)
    db.select({
      label: pointsOfTransaction.label,
      classification: demandEntries.classification,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(pointsOfTransaction, eq(demandEntries.pointOfTransactionId, pointsOfTransaction.id))
      .where(demandWhere)
      .groupBy(pointsOfTransaction.label, demandEntries.classification),

    // What matters free-text notes (demand only)
    db.select({
      text: demandEntries.whatMatters,
      date: sql<string>`${demandEntries.createdAt}::date`,
      demandTypeLabel: demandTypes.label,
      classification: demandEntries.classification,
    })
      .from(demandEntries)
      .leftJoin(demandTypes, eq(demandEntries.demandTypeId, demandTypes.id))
      .where(and(
        ...demandConditions,
        sql`${demandEntries.whatMatters} IS NOT NULL AND ${demandEntries.whatMatters} != ''`
      ))
      .orderBy(desc(demandEntries.createdAt)),

    // Collector stats (all entries — demand + work)
    db.select({
      name: demandEntries.collectorName,
      count: sql<number>`count(*)::int`,
      lastActive: sql<string>`max(${demandEntries.createdAt})::date`,
    })
      .from(demandEntries)
      .where(and(
        allWhere,
        sql`${demandEntries.collectorName} IS NOT NULL AND ${demandEntries.collectorName} != ''`
      ))
      .groupBy(demandEntries.collectorName)
      .orderBy(desc(sql`count(*)`)),
  ]);
  const failureFlowLinks = failureFlowLinksRaw;
  const whatMattersNotes = whatMattersNotesRaw;

  const handlingMap = new Map<string, { valueCount: number; failureCount: number }>();
  for (const row of handlingByClass) {
    if (!handlingMap.has(row.label)) {
      handlingMap.set(row.label, { valueCount: 0, failureCount: 0 });
    }
    const entry = handlingMap.get(row.label)!;
    if (row.classification === 'value') entry.valueCount = row.count;
    else if (row.classification === 'failure') entry.failureCount = row.count;
  }
  const handlingByClassification = Array.from(handlingMap.entries()).map(([label, counts]) => ({
    label,
    ...counts,
  }));

  const timeMap = new Map<string, { valueCount: number; failureCount: number }>();
  for (const row of demandOverTime) {
    if (!timeMap.has(row.date)) {
      timeMap.set(row.date, { valueCount: 0, failureCount: 0 });
    }
    const entry = timeMap.get(row.date)!;
    if (row.classification === 'value') entry.valueCount = row.count;
    else if (row.classification === 'failure') entry.failureCount = row.count;
  }
  const demandOverTimeResult = Array.from(timeMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  const potMap = new Map<string, { valueCount: number; failureCount: number }>();
  for (const row of potByClass) {
    if (!potMap.has(row.label)) {
      potMap.set(row.label, { valueCount: 0, failureCount: 0 });
    }
    const entry = potMap.get(row.label)!;
    if (row.classification === 'value') entry.valueCount = row.count;
    else if (row.classification === 'failure') entry.failureCount = row.count;
  }
  const pointOfTransactionByClassification = Array.from(potMap.entries()).map(([label, counts]) => ({
    label,
    ...counts,
  }));

  const collectorCounts = collectorStats.map(r => ({ name: r.name!, count: r.count, lastActive: r.lastActive }));

  // ── WORK AGGREGATIONS ──

  let workCount = 0;
  let workValueCount = 0;
  let workFailureCount = 0;
  let workSequenceCount = 0;
  let workUnknownCount = 0;
  let workTypeCounts: Array<{ label: string; count: number }> = [];
  let workTypesByClassification: Array<{ label: string; valueCount: number; failureCount: number; sequenceCount: number }> = [];
  let workOverTime: Array<{ date: string; valueCount: number; failureCount: number; sequenceCount: number; unknownCount: number }> = [];

  const workDone = (async () => {
  if (workTrackingEnabled) {
    // Work section — all three queries are independent. Parallelise.
    const [workClassCounts, wtCountsRaw, workTypeByClass, workOT] = await Promise.all([
      db.select({
        classification: demandEntries.classification,
        count: sql<number>`count(*)::int`,
      })
        .from(demandEntries)
        .where(workWhere)
        .groupBy(demandEntries.classification),

      // Work type counts
      db.select({
        label: workTypes.label,
        count: sql<number>`count(*)::int`,
      })
        .from(demandEntries)
        .innerJoin(workTypes, eq(demandEntries.workTypeId, workTypes.id))
        .where(workWhere)
        .groupBy(workTypes.label)
        .orderBy(desc(sql`count(*)`)),

      // Work types by classification
      db.select({
        label: workTypes.label,
        classification: demandEntries.classification,
        count: sql<number>`count(*)::int`,
      })
        .from(demandEntries)
        .innerJoin(workTypes, eq(demandEntries.workTypeId, workTypes.id))
        .where(workWhere)
        .groupBy(workTypes.label, demandEntries.classification),

      // Work over time
      db.select({
        date: sql<string>`${demandEntries.createdAt}::date`,
        classification: demandEntries.classification,
        count: sql<number>`count(*)::int`,
      })
        .from(demandEntries)
        .where(workWhere)
        .groupBy(sql`${demandEntries.createdAt}::date`, demandEntries.classification)
        .orderBy(sql`${demandEntries.createdAt}::date`),
    ]);
    workTypeCounts = wtCountsRaw;

    workValueCount = workClassCounts.find(c => c.classification === 'value')?.count || 0;
    workFailureCount = workClassCounts.find(c => c.classification === 'failure')?.count || 0;
    workSequenceCount = workClassCounts.find(c => c.classification === 'sequence')?.count || 0;
    workUnknownCount = workClassCounts.find(c => c.classification === 'unknown')?.count || 0;
    workCount = workValueCount + workFailureCount + workSequenceCount + workUnknownCount;

    const wtClassMap = new Map<string, { valueCount: number; failureCount: number; sequenceCount: number }>();
    for (const row of workTypeByClass) {
      if (!wtClassMap.has(row.label)) {
        wtClassMap.set(row.label, { valueCount: 0, failureCount: 0, sequenceCount: 0 });
      }
      const entry = wtClassMap.get(row.label)!;
      if (row.classification === 'value') entry.valueCount = row.count;
      else if (row.classification === 'failure') entry.failureCount = row.count;
      else if (row.classification === 'sequence') entry.sequenceCount = row.count;
    }
    workTypesByClassification = Array.from(wtClassMap.entries()).map(([label, counts]) => ({
      label,
      ...counts,
    }));

    const workTimeMap = new Map<string, { valueCount: number; failureCount: number; sequenceCount: number; unknownCount: number }>();
    for (const row of workOT) {
      if (!workTimeMap.has(row.date)) {
        workTimeMap.set(row.date, { valueCount: 0, failureCount: 0, sequenceCount: 0, unknownCount: 0 });
      }
      const entry = workTimeMap.get(row.date)!;
      if (row.classification === 'value') entry.valueCount = row.count;
      else if (row.classification === 'failure') entry.failureCount = row.count;
      else if (row.classification === 'sequence') entry.sequenceCount = row.count;
      else entry.unknownCount = row.count;
    }
    workOverTime = Array.from(workTimeMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }
  })();

  // ── LIFECYCLE AGGREGATIONS ──
  // Effective stage = entry.lifecycleStageId ?? type.lifecycleStageId
  const lifecycleByStageAndDemandType: Array<{ stageLabel: string; stageSortOrder: number; demandTypeLabel: string; demandTypeCategory: 'value' | 'failure'; count: number }> = [];
  let lifecycleFailureByStage: Array<{ stageLabel: string; stageSortOrder: number; count: number }> = [];

  const lifecycleDone = (async () => {
  if (lifecycleEnabled) {
    // Demand lifecycle grouped by stage + demand type (with category)
    const effectiveStage = sql<string>`COALESCE(${demandEntries.lifecycleStageId}, ${demandTypes.lifecycleStageId})`;
    const rows = await db.select({
      stageId: effectiveStage,
      demandTypeLabel: demandTypes.label,
      demandTypeCategory: demandTypes.category,
      classification: demandEntries.classification,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(demandTypes, eq(demandEntries.demandTypeId, demandTypes.id))
      .where(demandWhere)
      .groupBy(effectiveStage, demandTypes.label, demandTypes.category, demandEntries.classification);

    // Fetch all stages for this study for label/order lookup
    const stageRows = await db.select().from(lifecycleStages).where(eq(lifecycleStages.studyId, studyId));
    const stageMap = new Map(stageRows.map(s => [s.id, { label: s.label, sortOrder: s.sortOrder }]));

    // Build stage→type aggregation (collapse classification into counts)
    const byStageType = new Map<string, { stageLabel: string; stageSortOrder: number; demandTypeLabel: string; demandTypeCategory: 'value' | 'failure'; count: number }>();
    for (const row of rows) {
      const info = row.stageId ? stageMap.get(row.stageId) : null;
      const stageLabel = info?.label ?? 'Unassigned';
      const stageSortOrder = info?.sortOrder ?? 999;
      const key = `${stageLabel}||${row.demandTypeLabel}`;
      const existing = byStageType.get(key);
      if (existing) {
        existing.count += row.count;
      } else {
        byStageType.set(key, {
          stageLabel,
          stageSortOrder,
          demandTypeLabel: row.demandTypeLabel,
          demandTypeCategory: row.demandTypeCategory as 'value' | 'failure',
          count: row.count,
        });
      }
    }
    lifecycleByStageAndDemandType.push(...Array.from(byStageType.values()).sort((a, b) => a.stageSortOrder - b.stageSortOrder));

    // Failure-by-stage — include entries without a demand type (leftJoin), for the bar chart
    const failureStageEffective = sql<string>`COALESCE(${demandEntries.lifecycleStageId}, ${demandTypes.lifecycleStageId})`;
    const failureRows = await db.select({
      stageId: failureStageEffective,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .leftJoin(demandTypes, eq(demandEntries.demandTypeId, demandTypes.id))
      .where(and(...demandConditions, eq(demandEntries.classification, 'failure')))
      .groupBy(failureStageEffective);

    const failMap = new Map<string, { stageSortOrder: number; count: number }>();
    for (const row of failureRows) {
      const info = row.stageId ? stageMap.get(row.stageId) : null;
      const stageLabel = info?.label ?? 'Unassigned';
      const stageSortOrder = info?.sortOrder ?? 999;
      const existing = failMap.get(stageLabel);
      failMap.set(stageLabel, { stageSortOrder, count: (existing?.count ?? 0) + row.count });
    }
    lifecycleFailureByStage = Array.from(failMap.entries())
      .map(([stageLabel, v]) => ({ stageLabel, stageSortOrder: v.stageSortOrder, count: v.count }))
      .sort((a, b) => a.stageSortOrder - b.stageSortOrder);
  }
  })();

  // ── PHASE 4C: WORK STEP AGGREGATIONS ──
  // Only populated when workStepTypesEnabled; otherwise empty arrays so the
  // Work tab can cleanly hide the charts.
  let workStepFrequency: Array<{ label: string; tag: 'value' | 'failure'; count: number }> = [];
  let workStepByDemandType: Array<{ demandTypeLabel: string; workStepLabel: string; workStepTag: 'value' | 'failure'; count: number }> = [];
  const workStepByLifeProblem: Array<{ lifeProblemLabel: string; workStepLabel: string; workStepTag: 'value' | 'failure'; count: number }> = [];
  let capabilityByDemandType: Array<{ demandTypeLabel: string; valueBlocks: number; failureBlocks: number; pctValue: number }> = [];

  const workStepDone = (async () => {
  if (workStepTypesEnabled) {
    // The three selects below are mutually independent — fetch concurrently to
    // avoid stacking Neon round-trips. Post-processing is unchanged.
    const [freqRows, capRows, stepByWorkType] = await Promise.all([
      // 1) Top Work Steps (overall frequency, split by tag)
      db.select({
        label: workStepTypes.label,
        tag: workStepTypes.tag,
        count: sql<number>`count(*)::int`,
      })
        .from(workDescriptionBlocks)
        .innerJoin(workStepTypes, eq(workDescriptionBlocks.workStepTypeId, workStepTypes.id))
        .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
        .where(and(...baseConditions))
        .groupBy(workStepTypes.label, workStepTypes.tag)
        .orderBy(desc(sql`count(*)`)),
      // 4) Capability by work type (block-level value vs failure tags)
      db.select({
        label: workTypes.label,
        tag: workDescriptionBlocks.tag,
        count: sql<number>`count(*)::int`,
      })
        .from(workDescriptionBlocks)
        .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
        .innerJoin(workTypes, eq(demandEntries.workTypeId, workTypes.id))
        .where(and(eq(demandEntries.studyId, studyId), eq(demandEntries.entryType, 'work')))
        .groupBy(workTypes.label, workDescriptionBlocks.tag),
      // Work Step × Work Type cross-tab
      db.select({
        workTypeLabel: workTypes.label,
        workStepLabel: workStepTypes.label,
        workStepTag: workStepTypes.tag,
        count: sql<number>`count(*)::int`,
      })
        .from(workDescriptionBlocks)
        .innerJoin(workStepTypes, eq(workDescriptionBlocks.workStepTypeId, workStepTypes.id))
        .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
        .innerJoin(workTypes, eq(demandEntries.workTypeId, workTypes.id))
        .where(and(eq(demandEntries.studyId, studyId), eq(demandEntries.entryType, 'work')))
        .groupBy(workTypes.label, workStepTypes.label, workStepTypes.tag)
        .orderBy(desc(sql`count(*)`)),
    ]);
    workStepFrequency = freqRows.map(r => ({ label: r.label, tag: (r.tag === 'value' ? 'value' : 'failure') as 'value' | 'failure', count: r.count }));

    // 2) Work Step × Demand Type cross-tab. Join blocks → work entry → demand entry
    //    (each work entry is linked to its originating demand entry via shared
    //    customer/session? — actually no, work entries are standalone in this
    //    schema. We join through demandEntries.demandTypeId on the work entry
    //    itself, which won't be set (work entries use workTypeId, not demandTypeId).
    //    So Work Step × Demand Type only meaningfully aggregates when work
    //    entries have their own demand-type linkage — today they don't. This
    //    aggregation is therefore empty at v1. Kept as a stub so the chart can
    //    appear later when we add the linkage. Leaving the array empty.)
    //    Pragmatic fallback: surface Work Step × Work Type instead, which IS
    //    linked on work entries. Rename the interface too if it renders.
    //    For now, leave workStepByDemandType empty and let the chart hide.

    // 3) Work Step × Life Problem: same issue as #2 — life problems live on
    //    demand entries, not work entries. Empty at v1.

    // 4) Capability by Demand Type: uses BLOCK-level tags (value vs failure)
    //    across all work entries, grouped by... the demand types present? Same
    //    linkage issue. Instead, we report capability per WORK TYPE (which IS
    //    on work entries). Keep the interface named capabilityByDemandType for
    //    now but populate it via work types as the axis — simpler and truthful
    //    to what we actually have. (Query fetched in the Promise.all above.)
    const capMap = new Map<string, { value: number; failure: number }>();
    for (const r of capRows) {
      const entry = capMap.get(r.label) ?? { value: 0, failure: 0 };
      if (r.tag === 'value') entry.value += r.count;
      else if (r.tag === 'failure') entry.failure += r.count;
      capMap.set(r.label, entry);
    }
    capabilityByDemandType = [...capMap.entries()].map(([label, c]) => {
      const total = c.value + c.failure;
      const pctValue = total > 0 ? Math.round((c.value / total) * 100) : 0;
      return { demandTypeLabel: label, valueBlocks: c.value, failureBlocks: c.failure, pctValue };
    }).sort((a, b) => b.pctValue - a.pctValue);

    // Work Step × Work Type cross-tab (replaces the blocked demand/life-problem
    // ones; at least this one has real joinable data). Fetched above.
    // Re-purpose the demand-type-named slot to carry this (the rendering shell
    // is the same shape — label on X axis, workStep stacks; we can rename the
    // key + UI later when genuine demand-type linkage on work entries exists).
    workStepByDemandType = stepByWorkType.map(r => ({
      demandTypeLabel: r.workTypeLabel,
      workStepLabel: r.workStepLabel,
      workStepTag: (r.workStepTag === 'value' ? 'value' : 'failure') as 'value' | 'failure',
      count: r.count,
    }));
  }
  })();

  // ── FLOW FAILURE-DEMAND TYPES (migration 0033, slice 2) ──
  // Type + frequency of failure demand captured inline in flow, counted from
  // failure_demand work blocks. P2BS-scoped via baseConditions (the flow life
  // problem lives on the case). Only when the per-study feature is on.
  let flowFailureDemandTypeCounts: Array<{ label: string; count: number }> = [];
  const failureDemandDone = (async () => {
  if (flowFailureDemandTypesEnabled) {
    const rows = await db.select({
      label: demandTypes.label,
      count: sql<number>`count(*)::int`,
    })
      .from(workDescriptionBlocks)
      .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
      .innerJoin(demandTypes, eq(workDescriptionBlocks.demandTypeId, demandTypes.id))
      .where(and(...baseConditions, eq(workDescriptionBlocks.tag, 'failure_demand')))
      .groupBy(demandTypes.id, demandTypes.label)
      .orderBy(desc(sql`count(*)`));
    flowFailureDemandTypeCounts = rows.map(r => ({ label: r.label, count: r.count }));
  }
  })();

  // ── CAPABILITY OF RESPONSE (CoR) DISTRIBUTION ──
  // Share of each CoR type across flow touches. Flow touches are work entries
  // carrying handlingTypeId; the existing handlingTypeCounts is demand-only, so
  // count here over work entries. P2BS + date scoped via workConditions.
  let corTypeCounts: Array<{ label: string; count: number }> = [];
  const corDone = (async () => {
    const corRows = await db.select({
      label: handlingTypes.label,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(handlingTypes, eq(demandEntries.handlingTypeId, handlingTypes.id))
      .where(and(...workConditions))
      .groupBy(handlingTypes.label)
      .orderBy(desc(sql`count(*)`));
    corTypeCounts = corRows.map(r => ({ label: r.label, count: r.count }));
  })();

  // ── WORK BY VALUE STEP (migration 0047) ──
  // Where does failure/sequence (and value) work land across the customer value
  // journey? Count flow work blocks per value step, split by tag. P2BS-scoped
  // via baseConditions; ordered by the value step's own order. Feature-gated.
  let workByValueStep: Array<{ label: string; sortOrder: number; value: number; sequence: number; failure: number; failureDemand: number }> = [];
  let valueStepSystemConditions: Array<{ stepLabel: string; stepSortOrder: number; scLabel: string; count: number }> = [];
  const valueStepDone = (async () => {
  if (valueStepsEnabled) {
    const [rows, scRows] = await Promise.all([
      db.select({
        label: valueSteps.label,
        sortOrder: valueSteps.sortOrder,
        tag: workDescriptionBlocks.tag,
        count: sql<number>`count(*)::int`,
      })
        .from(workDescriptionBlocks)
        .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
        .innerJoin(valueSteps, eq(workDescriptionBlocks.valueStepId, valueSteps.id))
        .where(and(...baseConditions))
        .groupBy(valueSteps.id, valueSteps.label, valueSteps.sortOrder, workDescriptionBlocks.tag),
      // Per (value step × system condition) block counts — the CAUSES behind
      // the waste at each step, for the per-step overview cards. Junction rows
      // are re-pointed to the surviving SC at merge time, so excluding archived
      // conditions here reproduces getSystemConditionFrequencies' behaviour.
      // Same base scoping (study + P2BS + dates) as workByValueStep.
      systemConditionsEnabled
        ? db.select({
            stepLabel: valueSteps.label,
            stepSortOrder: valueSteps.sortOrder,
            scLabel: systemConditions.label,
            count: sql<number>`count(*)::int`,
          })
            .from(workBlockSystemConditions)
            .innerJoin(workDescriptionBlocks, eq(workBlockSystemConditions.workBlockId, workDescriptionBlocks.id))
            .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
            .innerJoin(valueSteps, eq(workDescriptionBlocks.valueStepId, valueSteps.id))
            .innerJoin(systemConditions, eq(workBlockSystemConditions.systemConditionId, systemConditions.id))
            .where(and(...baseConditions, isNull(systemConditions.archivedAt)))
            .groupBy(valueSteps.id, valueSteps.label, valueSteps.sortOrder, systemConditions.id, systemConditions.label)
            .orderBy(desc(sql`count(*)`))
        : Promise.resolve([]),
    ]);
    valueStepSystemConditions = scRows;
    const byStep = new Map<string, { label: string; sortOrder: number; value: number; sequence: number; failure: number; failureDemand: number }>();
    for (const r of rows) {
      const key = `${r.sortOrder}::${r.label}`;
      const e = byStep.get(key) ?? { label: r.label, sortOrder: r.sortOrder, value: 0, sequence: 0, failure: 0, failureDemand: 0 };
      if (r.tag === 'value') e.value += r.count;
      else if (r.tag === 'sequence') e.sequence += r.count;
      else if (r.tag === 'failure') e.failure += r.count;
      else if (r.tag === 'failure_demand') e.failureDemand += r.count;
      byStep.set(key, e);
    }
    workByValueStep = [...byStep.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  })();

  // Perf: the six sections above (work / lifecycle / work-step / failure-demand /
  // CoR / value-step) are mutually independent and were kicked off concurrently
  // as IIFEs — await them all here so the whole group costs ~one section's waves
  // (the slowest) instead of the sum. Each assigns to the outer vars above.
  await Promise.all([workDone, lifecycleDone, workStepDone, failureDemandDone, corDone, valueStepDone]);

  return {
    totalEntries,
    valueCount,
    failureCount,
    unknownCount,
    perfectPercentage,
    demandTypeCounts,
    handlingTypeCounts,
    contactMethodCounts,
    lifeProblemCounts,
    whatMattersCounts,
    whatMattersByClassification,
    handlingByClassification,
    pointOfTransactionByClassification,
    demandOverTime: demandOverTimeResult,
    failureCauses: failureCausesRaw.map(r => ({ cause: r.cause!, count: r.count })),
    helpingConditions: helpingConditionsRaw.map(r => ({ cause: r.cause!, count: r.count })),
    failuresByOriginalValueDemand,
    failureFlowLinks,
    whatMattersNotes: whatMattersNotes.map(r => ({ text: r.text!, date: r.date, demandTypeLabel: r.demandTypeLabel || null, classification: r.classification })),
    collectorCounts,
    workCount,
    workValueCount,
    workFailureCount,
    workSequenceCount,
    workUnknownCount,
    workTypeCounts,
    workTypesByClassification,
    workOverTime,
    lifecycleEnabled,
    lifecycleByStageAndDemandType,
    lifecycleFailureByStage,
    workStepTypesEnabled,
    workStepFrequency,
    workStepByDemandType,
    workStepByLifeProblem,
    capabilityByDemandType,
    flowFailureDemandTypeCounts,
    corTypeCounts,
    valueStepsEnabled,
    workByValueStep,
    valueStepSystemConditions,
  };
}

export async function getFailureCausesForFlow(
  studyId: string,
  sourceLabel: string,
  targetLabel: string,
  from?: Date,
  to?: Date,
): Promise<Array<{ cause: string; count: number }>> {
  // Check if study uses managed system conditions
  const study = await db.select().from(studies).where(eq(studies.id, studyId));
  const scEnabled = study[0]?.systemConditionsEnabled ?? false;

  const baseConditions = [
    eq(demandEntries.studyId, studyId),
    eq(demandEntries.entryType, 'demand'),
    eq(demandEntries.classification, 'failure'),
  ];
  if (from) baseConditions.push(gte(demandEntries.createdAt, from));
  if (to) baseConditions.push(lte(demandEntries.createdAt, to));

  const originalDT = alias(demandTypes, 'originalDT');
  const failureDT = alias(demandTypes, 'failureDT');

  if (scEnabled) {
    const results = await db.select({
      cause: systemConditions.label,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntrySystemConditions)
      .innerJoin(systemConditions, eq(demandEntrySystemConditions.systemConditionId, systemConditions.id))
      .innerJoin(demandEntries, eq(demandEntrySystemConditions.demandEntryId, demandEntries.id))
      .innerJoin(originalDT, eq(demandEntries.originalValueDemandTypeId, originalDT.id))
      .innerJoin(failureDT, eq(demandEntries.demandTypeId, failureDT.id))
      .where(and(
        ...baseConditions,
        eq(originalDT.label, sourceLabel),
        eq(failureDT.label, targetLabel),
        eq(demandEntrySystemConditions.dimension, 'hinders'),
      ))
      .groupBy(systemConditions.label)
      .orderBy(desc(sql`count(*)`));

    return results.map(r => ({ cause: r.cause!, count: r.count }));
  } else {
    const conditions = [
      ...baseConditions,
      sql`${demandEntries.failureCause} IS NOT NULL AND ${demandEntries.failureCause} != ''`,
    ];

    const results = await db.select({
      cause: demandEntries.failureCause,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(originalDT, eq(demandEntries.originalValueDemandTypeId, originalDT.id))
      .innerJoin(failureDT, eq(demandEntries.demandTypeId, failureDT.id))
      .where(and(
        ...conditions,
        eq(originalDT.label, sourceLabel),
        eq(failureDT.label, targetLabel),
      ))
      .groupBy(demandEntries.failureCause)
      .orderBy(desc(sql`count(*)`));

    return results.map(r => ({ cause: r.cause!, count: r.count }));
  }
}

// Capability / lead-time (2026-06-18): the time between any two chosen events
// across a study's cases, as an XmR individuals (capability) chart. Events:
//   'caseOpen' | 'caseClose' | 'decision:<typeId>' | 'milestone:<id>'
//   | 'whatMattersTarget:<typeId>'  (the customer's wanted date, 2026-07-01)
//   | 'whatMattersAsap:<typeId>'    (ASAP anchor milestone reached, 2026-07-01)
// ('firstContact' is a legacy alias kept only in the resolver — it now resolves
//  identically to 'caseOpen', 2026-07-07: the two starts were unified.)
// All timestamps already captured — read-only analytics, no schema change.
// Reads are kept FLAT and assembled in JS (Drizzle correlated-subquery gotcha).
type EventToken = string;

function eventTimestamp(
  token: EventToken,
  ctx: {
    openedAt: Date; closedAt: Date | null; earliestTouchAt: Date | null;
    milestones: Map<string, Date>;
    whatMattersTargets: Map<string, Date>;
    // Types this case selected + the study's typeId→anchor-token map, so the ASAP
    // measure auto-scopes to cases that actually chose the ASAP factor.
    whatMattersSelected: Set<string>; asapAnchors: Map<string, string>;
  },
): Date | null {
  // The end-to-end start. 'caseOpen' is the real start (cases.openedAt), floored
  // to the earliest effective touch when that is earlier — so a retrospective
  // case whose openedAt was left at the data-entry day never starts "today".
  // 'firstContact' is a legacy alias resolving identically (unified 2026-07-07).
  if (token === 'caseOpen' || token === 'firstContact') {
    const t = ctx.earliestTouchAt;
    return t && t.getTime() < ctx.openedAt.getTime() ? t : ctx.openedAt;
  }
  if (token === 'caseClose') return ctx.closedAt;
  if (token.startsWith('milestone:')) return ctx.milestones.get(token.slice('milestone:'.length)) ?? null;
  if (token.startsWith('whatMattersTarget:')) return ctx.whatMattersTargets.get(token.slice('whatMattersTarget:'.length)) ?? null;
  if (token.startsWith('whatMattersAsap:')) {
    const typeId = token.slice('whatMattersAsap:'.length);
    if (!ctx.whatMattersSelected.has(typeId)) return null; // only ASAP-tagged cases
    const anchorToken = ctx.asapAnchors.get(typeId);
    // The anchor is a 'milestone:<id>' / 'decision:<typeId>' token — resolve it
    // with the same resolver (never itself a whatMattersAsap token, so no loop).
    return anchorToken ? eventTimestamp(anchorToken, ctx) : null;
  }
  return null;
}

// XmR (individuals) statistics for a TIME-ORDERED value series. mrBar = mean of
// |consecutive differences|; limits = mean ± 2.66·mrBar. floorZero clamps the
// lower limit at 0 for measures that can't go negative (lead time / touches /
// steps); leave false for signed measures (variance). n<2 → null limits. Shared
// by getCapabilityData + getTouchesPerCaseCapability + getStepsPerCaseCapability.
function xmrLimits(values: number[], { floorZero }: { floorZero: boolean }): { mean: number | null; median: number | null; unpl: number | null; lnpl: number | null } {
  const n = values.length;
  const mean = n ? values.reduce((s, v) => s + v, 0) / n : null;
  const sorted = [...values].sort((a, b) => a - b);
  const median = n ? (n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2) : null;
  let unpl: number | null = null;
  let lnpl: number | null = null;
  if (n >= 2 && mean !== null) {
    let mrSum = 0;
    for (let i = 1; i < values.length; i++) mrSum += Math.abs(values[i] - values[i - 1]);
    const mrBar = mrSum / (values.length - 1);
    unpl = mean + 2.66 * mrBar;
    lnpl = floorZero ? Math.max(0, mean - 2.66 * mrBar) : mean - 2.66 * mrBar;
  }
  return { mean, median, unpl, lnpl };
}

export async function getCapabilityData(
  studyId: string,
  fromEvent: EventToken,
  toEvent: EventToken,
  dateFrom?: Date,
  dateTo?: Date,
  sort: 'start' | 'closed' = 'start',
  metric: 'leadTime' | 'touches' | 'variance' = 'leadTime',
  valueDemands?: string[],
  // Optional what-matters scope: restrict to cases that selected this type.
  // Gives the "ASAP" measure its meaning (scope to the asap type, then read
  // case-open → completion lead time).
  whatMattersScopeTypeId?: string,
): Promise<CapabilityData> {
  const unit = metric === 'touches' ? 'touches' : 'days';
  const empty: CapabilityData = { unit, points: [], mean: null, median: null, unpl: null, lnpl: null, n: 0, nExcluded: 0, nWantedByDate: 0 };

  // Value-demand scope: capability is case-level, so filter the case set directly.
  const caseWhere = await valueDemandCaseWhere(studyId, valueDemands);
  let caseRows = await db.select({ id: cases.id, caseRef: cases.caseRef, openedAt: cases.openedAt, closedAt: cases.closedAt })
    .from(cases).where(caseWhere);
  if (caseRows.length === 0) return empty;

  // What-matters scope: keep only cases that selected the given type.
  if (whatMattersScopeTypeId) {
    const scopeRows = await db.select({ caseId: caseWhatMatters.caseId })
      .from(caseWhatMatters)
      .where(and(inArray(caseWhatMatters.caseId, caseRows.map((c) => c.id)), eq(caseWhatMatters.whatMattersTypeId, whatMattersScopeTypeId)));
    const scopeSet = new Set(scopeRows.map((r) => r.caseId));
    caseRows = caseRows.filter((c) => scopeSet.has(c.id));
    if (caseRows.length === 0) return empty;
  }

  // End-to-end scope (2026-07-03): lead time measures how long the work took,
  // which is only the right lens for customers who wanted it AS SOON AS POSSIBLE.
  // Customers who chose a "When I want it" (by_date) what-matters are hidden from
  // the lead-time metric — for them, hitting the date is what matters (the
  // variance metric). ASAP + un-timed cases stay. Count the hidden ones for the
  // info "eye". Lead-time only; variance/touches are unaffected.
  let nWantedByDate = 0;
  if (metric === 'leadTime') {
    const byDateTypes = await db.select({ id: whatMattersTypes.id })
      .from(whatMattersTypes)
      .where(and(eq(whatMattersTypes.studyId, studyId), eq(whatMattersTypes.timing, 'by_date')));
    if (byDateTypes.length > 0) {
      const byDateRows = await db.select({ caseId: caseWhatMatters.caseId })
        .from(caseWhatMatters)
        .where(and(inArray(caseWhatMatters.caseId, caseRows.map((c) => c.id)), inArray(caseWhatMatters.whatMattersTypeId, byDateTypes.map((t) => t.id))));
      const byDateSet = new Set(byDateRows.map((r) => r.caseId));
      const before = caseRows.length;
      caseRows = caseRows.filter((c) => !byDateSet.has(c.id));
      nWantedByDate = before - caseRows.length;
      if (caseRows.length === 0) return { ...empty, nWantedByDate };
    }
  }
  const caseIds = caseRows.map((c) => c.id);

  // All case what-matters selections → per-case target dates (by_date) AND the set
  // of types each case selected (so the ASAP measure auto-scopes to ASAP cases).
  const wmRows = await db.select({ caseId: caseWhatMatters.caseId, whatMattersTypeId: caseWhatMatters.whatMattersTypeId, targetDate: caseWhatMatters.targetDate })
    .from(caseWhatMatters)
    .where(inArray(caseWhatMatters.caseId, caseIds));
  const wmTargetByCase = new Map<string, Map<string, Date>>();
  const wmSelectedByCase = new Map<string, Set<string>>();
  for (const r of wmRows) {
    if (!wmSelectedByCase.has(r.caseId)) wmSelectedByCase.set(r.caseId, new Set());
    wmSelectedByCase.get(r.caseId)!.add(r.whatMattersTypeId);
    if (r.targetDate) {
      if (!wmTargetByCase.has(r.caseId)) wmTargetByCase.set(r.caseId, new Map());
      wmTargetByCase.get(r.caseId)!.set(r.whatMattersTypeId, new Date(r.targetDate as unknown as string));
    }
  }
  // Study-level typeId → anchor event token (the ASAP type's measured-to event:
  // a 'milestone:<id>' or 'decision:<typeId>' token). Falls back to the legacy
  // milestone-only column.
  const anchorRows = await db.select({ id: whatMattersTypes.id, anchorEvent: whatMattersTypes.anchorEvent, anchorMilestoneId: whatMattersTypes.anchorMilestoneId })
    .from(whatMattersTypes)
    .where(eq(whatMattersTypes.studyId, studyId));
  const asapAnchors = new Map<string, string>();
  for (const r of anchorRows) {
    const tok = r.anchorEvent ?? (r.anchorMilestoneId ? `milestone:${r.anchorMilestoneId}` : null);
    if (tok) asapAnchors.set(r.id, tok);
  }

  // Per-measure annotations (exclude / note), keyed by caseId for this event-pair.
  const annoRows = await db.select().from(capabilityAnnotations)
    .where(and(eq(capabilityAnnotations.studyId, studyId), eq(capabilityAnnotations.fromEvent, fromEvent), eq(capabilityAnnotations.toEvent, toEvent)));
  const annoByCase = new Map<string, { excluded: boolean; note: string | null }>();
  for (const a of annoRows) annoByCase.set(a.caseId, { excluded: a.excluded, note: a.note });

  // Flat reads, one per event source. earliestTouch = earliest EFFECTIVE touch
  // date per case, used to FLOOR the case-open start (see eventTimestamp). Effective
  // date = COALESCE(block_date, entry.created_at): when a case is entered
  // retrospectively the work-block dates are backdated to when the touch really
  // happened, while entry.created_at is the data-entry day. Flooring the start to
  // this stops a retrospective case (openedAt left at "today") from starting after
  // its own backdated milestones/decisions → negative window → silently dropped.
  // Mirrors the over-time charts' COALESCE(blockDate, createdAt) bucketing (0031).
  const [fcRows, msRows] = await Promise.all([
    db.select({ caseId: demandEntries.caseId, firstAt: sql<string>`min(coalesce(${workDescriptionBlocks.blockDate}, ${demandEntries.createdAt}))` })
      .from(demandEntries)
      .leftJoin(workDescriptionBlocks, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
      .where(and(eq(demandEntries.studyId, studyId), isNotNull(demandEntries.caseId)))
      .groupBy(demandEntries.caseId),
    db.select({ caseId: caseMilestones.caseId, milestoneId: caseMilestones.milestoneId, reachedAt: caseMilestones.reachedAt })
      .from(caseMilestones).where(inArray(caseMilestones.caseId, caseIds)),
  ]);

  const fcMap = new Map<string, Date>();
  for (const r of fcRows) if (r.caseId && r.firstAt) fcMap.set(r.caseId, new Date(r.firstAt));
  const msByCase = new Map<string, Map<string, Date>>();
  for (const r of msRows) {
    if (!msByCase.has(r.caseId)) msByCase.set(r.caseId, new Map());
    msByCase.get(r.caseId)!.set(r.milestoneId, new Date(r.reachedAt as unknown as string));
  }

  // For the 'touches' metric we count entries per case inside the window — pull
  // every entry timestamp once and bucket by case (only when needed).
  const entriesByCase = new Map<string, Date[]>();
  if (metric === 'touches') {
    // One row per entry, dated by its effective date (earliest block date, else
    // created_at) so backdated touches land in the right window — same reason as
    // first contact above.
    const entryRows = await db.select({ caseId: demandEntries.caseId, eff: sql<string>`min(coalesce(${workDescriptionBlocks.blockDate}, ${demandEntries.createdAt}))` })
      .from(demandEntries)
      .leftJoin(workDescriptionBlocks, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
      .where(and(eq(demandEntries.studyId, studyId), isNotNull(demandEntries.caseId)))
      .groupBy(demandEntries.caseId, demandEntries.id);
    for (const r of entryRows) {
      if (!r.caseId) continue;
      if (!entriesByCase.has(r.caseId)) entriesByCase.set(r.caseId, []);
      entriesByCase.get(r.caseId)!.push(new Date(r.eff));
    }
  }

  // Per case: resolve both events; keep cases where both exist and to ≥ from.
  type Raw = { caseId: string; caseRef: string; fromTs: Date; startTs: Date; closedAt: Date | null; leadTime: number; excluded: boolean; note: string | null };
  const raw: Raw[] = [];
  for (const c of caseRows) {
    const ctx = {
      openedAt: new Date(c.openedAt as unknown as string),
      closedAt: c.closedAt ? new Date(c.closedAt as unknown as string) : null,
      earliestTouchAt: fcMap.get(c.id) ?? null,
      milestones: msByCase.get(c.id) ?? new Map<string, Date>(),
      whatMattersTargets: wmTargetByCase.get(c.id) ?? new Map<string, Date>(),
      whatMattersSelected: wmSelectedByCase.get(c.id) ?? new Set<string>(),
      asapAnchors,
    };
    const fromTs = eventTimestamp(fromEvent, ctx);
    const toTs = eventTimestamp(toEvent, ctx);
    if (!fromTs || !toTs) continue;
    // R12 (2026-06-19): compare at WHOLE-DAY granularity. Milestone/decision
    // dates come from a date picker (stored date-only at noon), while openedAt /
    // entry createdAt carry real wall-clock times. Diffing at full resolution
    // made a same-day "to" event (noon) look earlier than a "from" event (e.g.
    // 13:56) → spurious negative → the case got dropped. The measure is in days,
    // so snap every event to its UTC calendar day.
    const dayIndex = (d: Date) => Math.floor(d.getTime() / 86_400_000);
    const fromDay = dayIndex(fromTs);
    const toDay = dayIndex(toTs);
    // 'variance' (days early/late vs the customer's date) is SIGNED — a case
    // that finished before the target (toDay < fromDay = early) is kept as a
    // negative. Other metrics drop that as a spurious negative window.
    if (metric !== 'variance' && toDay < fromDay) continue;
    if (dateFrom && fromTs.getTime() < dateFrom.getTime()) continue;
    if (dateTo && fromTs.getTime() > dateTo.getTime()) continue;
    // The plotted value: whole-day lead time, or the count of touches in the
    // [fromDay, toDay] window (inclusive). The field stays named leadTime — it
    // carries "the metric value"; `unit` disambiguates days vs touches.
    let value: number;
    if (metric === 'touches') {
      const stamps = entriesByCase.get(c.id) ?? [];
      value = stamps.filter((d) => { const day = dayIndex(d); return day >= fromDay && day <= toDay; }).length;
    } else {
      value = toDay - fromDay;
    }
    const anno = annoByCase.get(c.id);
    // 'start'-order key = the case-open date (the "First contact (case opened)"
    // event), independent of the chosen FROM event. openedAt is NOT NULL so this
    // is always defined.
    const startTs = eventTimestamp('caseOpen', ctx)!;
    raw.push({ caseId: c.id, caseRef: c.caseRef, fromTs, startTs, closedAt: ctx.closedAt, leadTime: value, excluded: anno?.excluded ?? false, note: anno?.note ?? null });
  }
  if (raw.length === 0) return empty;

  // XmR needs a time order; the chosen order changes the moving ranges → limits.
  // 'start' = by the case-open date (the "First contact (case opened)" event =
  // min(openedAt, earliest touch)), INDEPENDENT of the chosen FROM event.
  // 'closed' = by case close date (still-open cases, closedAt null, sort last;
  // tie-break by start).
  if (sort === 'closed') {
    raw.sort((a, b) => {
      const ax = a.closedAt ? a.closedAt.getTime() : Infinity;
      const bx = b.closedAt ? b.closedAt.getTime() : Infinity;
      return ax !== bx ? ax - bx : a.startTs.getTime() - b.startTs.getTime();
    });
  } else {
    raw.sort((a, b) => a.startTs.getTime() - b.startTs.getTime());
  }

  // Limits + mean/median are computed from INCLUDED points only; excluded points
  // still ride along on the chart (greyed) but don't move the limits.
  const included = raw.filter((r) => !r.excluded);
  const values = included.map((r) => r.leadTime);
  const n = values.length;
  // Lead time / touches can't be negative (floor at 0); variance is signed, so its
  // lower limit may legitimately be negative (delivered early).
  const { mean, median, unpl, lnpl } = xmrLimits(values, { floorZero: metric !== 'variance' });

  const round1 = (x: number) => Math.round(x * 10) / 10;
  const points = raw.map((r) => ({
    caseId: r.caseId,
    caseRef: r.caseRef,
    leadTime: r.leadTime,
    startedAt: r.fromTs.toISOString(),
    // only included points can be "special"; excluded ones are set aside.
    special: !r.excluded && unpl !== null && lnpl !== null && (r.leadTime > unpl || r.leadTime < lnpl),
    excluded: r.excluded,
    note: r.note,
  }));

  return {
    unit,
    points,
    mean: mean !== null ? round1(mean) : null,
    median: median !== null ? round1(median) : null,
    unpl: unpl !== null ? round1(unpl) : null,
    lnpl: lnpl !== null ? round1(lnpl) : null,
    n,
    nExcluded: raw.length - n,
    nWantedByDate,
  };
}

// "Touches over time" (per-day touch counts by classification). A touch = a work
// entry with ≥1 work block (innerJoin enforces that). Bucketed by the touch's
// EFFECTIVE date min(coalesce(block_date, created_at)) so backdated retrospective
// touches land on their real day — matches getCapabilityData / over-time charts,
// NOT raw created_at. Scope: case > life problem (P2BS, via the case) > all.
// Touches-per-case XmR (2026-07-08): one point per case = that case's total touch
// count (a touch = one work entry with ≥1 block). Ordered by the case-open date
// (min(openedAt, earliest touch) — the "First contact (case opened)" start).
// Scoped by value demand; the date range filters touches by effective date.
export async function getTouchesPerCaseCapability(
  studyId: string,
  opts: { valueDemands?: string[]; from?: Date; to?: Date } = {},
): Promise<CapabilityData> {
  const { valueDemands, from, to } = opts;
  const empty: CapabilityData = { unit: 'touches', points: [], mean: null, median: null, unpl: null, lnpl: null, n: 0, nExcluded: 0, nWantedByDate: 0 };
  const caseWhere = await valueDemandCaseWhere(studyId, valueDemands);
  const caseRows = await db.select({ id: cases.id, caseRef: cases.caseRef, openedAt: cases.openedAt }).from(cases).where(caseWhere);
  if (caseRows.length === 0) return empty;

  // One row per work entry (≥1 block) with its effective date.
  const entryRows = await db.select({
    caseId: demandEntries.caseId,
    eff: sql<string>`min(coalesce(${workDescriptionBlocks.blockDate}, ${demandEntries.createdAt}))`,
  })
    .from(demandEntries)
    .innerJoin(workDescriptionBlocks, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
    .where(and(eq(demandEntries.studyId, studyId), eq(demandEntries.entryType, 'work'), isNotNull(demandEntries.caseId)))
    .groupBy(demandEntries.caseId, demandEntries.id);

  const byCase = new Map<string, Date[]>();
  for (const r of entryRows) {
    if (!r.caseId || !r.eff) continue;
    let arr = byCase.get(r.caseId);
    if (!arr) { arr = []; byCase.set(r.caseId, arr); }
    arr.push(new Date(r.eff));
  }

  const fromMs = from ? from.getTime() : null;
  const toMs = to ? to.getTime() : null;
  type Row = { caseId: string; caseRef: string; touches: number; startKey: number };
  const rows: Row[] = [];
  for (const c of caseRows) {
    const effs = byCase.get(c.id) ?? [];
    const inRange = effs.filter((d) => {
      const ms = d.getTime();
      if (fromMs !== null && ms < fromMs) return false;
      if (toMs !== null && ms > toMs) return false;
      return true;
    });
    if (inRange.length === 0) continue; // drop cases with no touch in range
    const openedMs = new Date(c.openedAt as unknown as string).getTime();
    const earliest = effs.length ? Math.min(...effs.map((d) => d.getTime())) : openedMs;
    rows.push({ caseId: c.id, caseRef: c.caseRef, touches: inRange.length, startKey: Math.min(openedMs, earliest) });
  }
  if (rows.length === 0) return empty;
  rows.sort((a, b) => a.startKey - b.startKey);

  const values = rows.map((r) => r.touches);
  const { mean, median, unpl, lnpl } = xmrLimits(values, { floorZero: true });
  const round1 = (x: number) => Math.round(x * 10) / 10;
  const points = rows.map((r) => ({
    caseId: r.caseId,
    caseRef: r.caseRef,
    leadTime: r.touches,
    startedAt: new Date(r.startKey).toISOString(),
    special: unpl !== null && lnpl !== null && (r.touches > unpl || r.touches < lnpl),
    excluded: false,
    note: null as string | null,
  }));
  return {
    unit: 'touches', points,
    mean: mean !== null ? round1(mean) : null,
    median: median !== null ? round1(median) : null,
    unpl: unpl !== null ? round1(unpl) : null,
    lnpl: lnpl !== null ? round1(lnpl) : null,
    n: values.length, nExcluded: 0, nWantedByDate: 0,
  };
}

// Steps-per-case XmR (2026-07-08): one point per case = its step count for the
// chosen tag (total / value / sequence / failure / failure_demand), as a count or
// as a % of that case's total steps. A step = one work_description_blocks row.
// Ordered by the case-open date; scoped by value demand; range-filtered by the
// block's effective date. Cases with no steps in range are dropped; a case with
// steps but zero of the chosen tag is a legitimate 0 point.
export async function getStepsPerCaseCapability(
  studyId: string,
  opts: { valueDemands?: string[]; from?: Date; to?: Date; tag?: 'total' | 'value' | 'sequence' | 'failure' | 'failure_demand'; mode?: 'count' | 'pct' } = {},
): Promise<CapabilityData> {
  const { valueDemands, from, to } = opts;
  const tag = opts.tag ?? 'total';
  const mode = opts.mode ?? 'count';
  const unit: CapabilityData['unit'] = mode === 'pct' ? '%' : 'steps';
  const empty: CapabilityData = { unit, points: [], mean: null, median: null, unpl: null, lnpl: null, n: 0, nExcluded: 0, nWantedByDate: 0 };
  const caseWhere = await valueDemandCaseWhere(studyId, valueDemands);
  const caseRows = await db.select({ id: cases.id, caseRef: cases.caseRef, openedAt: cases.openedAt }).from(cases).where(caseWhere);
  if (caseRows.length === 0) return empty;

  // One row per work block: its case, tag, and effective date.
  const blockRows = await db.select({
    caseId: demandEntries.caseId,
    tag: workDescriptionBlocks.tag,
    eff: sql<string>`coalesce(${workDescriptionBlocks.blockDate}, ${demandEntries.createdAt})`,
  })
    .from(workDescriptionBlocks)
    .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
    .where(and(eq(demandEntries.studyId, studyId), eq(demandEntries.entryType, 'work'), isNotNull(demandEntries.caseId)));

  const byCase = new Map<string, { tag: string; ms: number }[]>();
  for (const r of blockRows) {
    if (!r.caseId || !r.eff) continue;
    let arr = byCase.get(r.caseId);
    if (!arr) { arr = []; byCase.set(r.caseId, arr); }
    arr.push({ tag: r.tag, ms: new Date(r.eff).getTime() });
  }

  const fromMs = from ? from.getTime() : null;
  const toMs = to ? to.getTime() : null;
  type Row = { caseId: string; caseRef: string; value: number; startKey: number };
  const rows: Row[] = [];
  for (const c of caseRows) {
    const blocks = byCase.get(c.id) ?? [];
    const inRange = blocks.filter((b) => {
      if (fromMs !== null && b.ms < fromMs) return false;
      if (toMs !== null && b.ms > toMs) return false;
      return true;
    });
    const total = inRange.length;
    if (total === 0) continue; // no steps in range → not on the chart
    const tagCount = tag === 'total' ? total : inRange.filter((b) => b.tag === tag).length;
    const value = mode === 'pct' ? Math.round((tagCount / total) * 1000) / 10 : tagCount;
    const openedMs = new Date(c.openedAt as unknown as string).getTime();
    const earliest = blocks.length ? Math.min(...blocks.map((b) => b.ms)) : openedMs;
    rows.push({ caseId: c.id, caseRef: c.caseRef, value, startKey: Math.min(openedMs, earliest) });
  }
  if (rows.length === 0) return empty;
  rows.sort((a, b) => a.startKey - b.startKey);

  const values = rows.map((r) => r.value);
  const { mean, median, unpl, lnpl } = xmrLimits(values, { floorZero: true });
  const round1 = (x: number) => Math.round(x * 10) / 10;
  const points = rows.map((r) => ({
    caseId: r.caseId,
    caseRef: r.caseRef,
    leadTime: r.value,
    startedAt: new Date(r.startKey).toISOString(),
    special: unpl !== null && lnpl !== null && (r.value > unpl || r.value < lnpl),
    excluded: false,
    note: null as string | null,
  }));
  return {
    unit, points,
    mean: mean !== null ? round1(mean) : null,
    median: median !== null ? round1(median) : null,
    unpl: unpl !== null ? round1(unpl) : null,
    lnpl: lnpl !== null ? round1(lnpl) : null,
    n: values.length, nExcluded: 0, nWantedByDate: 0,
  };
}

// --- Ask delivery (2026-07-02, slice 4) -------------------------------------
// How well the system delivers on what matters: per capture field LINKED to a
// what-matters type, evaluate every case that carries BOTH the ask and a
// recorded decision value, using the shared rules in ask-verdict.ts (the same
// rules the capture-side live evaluation shows). P2BS scope filters the case
// set by its primary life problem (like getCapabilityData); the from/to range
// filters on the decision's decidedAt. Cases whose decision is recorded but
// whose value box was left empty are surfaced as notCaptured — a capture miss
// is itself a finding, not something to hide.
export interface AskDeliveryRow {
  fieldId: string;
  fieldLabel: string;
  decisionLabel: string; // the milestone label since 0042
  whatMattersTypeId: string;
  whatMattersLabel: string;
  kind: 'amount' | 'number' | 'percent' | 'currency' | 'calculated' | 'date' | 'duration' | 'duration_months' | 'text' | 'choice';
  n: number;          // cases evaluated (ask + delivered value present)
  metCount: number;
  notCaptured: number; // ask + completed milestone, but no usable delivered value
  lateCount: number;  // date kind only: not-met cases
  avgDaysLate: number | null; // date kind only: mean days late among lateCount
  avgDiffMonths: number | null; // duration kind only: mean |diff| among not-met
  overCount: number;  // amount kind only: over-budget cases
  avgAmountOver: number | null; // amount kind only: mean amount over among overCount
}

export async function getAskDeliveryData(studyId: string, from?: Date, to?: Date, valueDemands?: string[]): Promise<AskDeliveryRow[]> {
  // Linked subquestions only — an unlinked one has no ask to evaluate against.
  const fields = await db
    .select({
      id: subquestions.id,
      label: subquestions.label,
      kind: subquestions.kind,
      milestoneId: subquestions.milestoneId,
      linkedWhatMattersTypeId: subquestions.linkedWhatMattersTypeId,
      sortOrder: subquestions.sortOrder,
      decisionLabel: milestones.label,
      decisionSort: milestones.sortOrder,
    })
    .from(subquestions)
    .innerJoin(milestones, eq(subquestions.milestoneId, milestones.id))
    .where(and(eq(milestones.studyId, studyId), isNotNull(subquestions.linkedWhatMattersTypeId)));
  if (fields.length === 0) return [];

  // Value-demand scope: filter the case set by its value demand(s).
  const caseWhere = await valueDemandCaseWhere(studyId, valueDemands);
  const caseRows = await db.select({ id: cases.id }).from(cases).where(caseWhere);
  if (caseRows.length === 0) return [];
  const caseIds = caseRows.map((c) => c.id);

  const msIds = [...new Set(fields.map((f) => f.milestoneId))];
  const wmTypeIds = [...new Set(fields.map((f) => f.linkedWhatMattersTypeId!))];

  // A value only counts while its MILESTONE is complete (and in range on
  // reachedAt — the analogue of the old decision decidedAt).
  const msConds = [inArray(caseMilestones.caseId, caseIds), inArray(caseMilestones.milestoneId, msIds)];
  if (from) msConds.push(gte(caseMilestones.reachedAt, from));
  if (to) msConds.push(lte(caseMilestones.reachedAt, to));
  const msRows = await db.select({ caseId: caseMilestones.caseId, milestoneId: caseMilestones.milestoneId })
    .from(caseMilestones).where(and(...msConds));
  // Per milestone: the cases whose milestone is complete (in range).
  const completedCasesByMs = new Map<string, string[]>();
  for (const m of msRows) {
    const list = completedCasesByMs.get(m.milestoneId) ?? [];
    list.push(m.caseId);
    completedCasesByMs.set(m.milestoneId, list);
  }

  const valueRows = await db.select().from(caseSubquestionAnswers)
    .where(and(inArray(caseSubquestionAnswers.caseId, caseIds), inArray(caseSubquestionAnswers.subquestionId, fields.map((f) => f.id))));
  const valuesByCaseField = new Map(valueRows.map((v) => [`${v.caseId}:${v.subquestionId}`, v]));
  const askRows = await db.select().from(caseWhatMatters)
    .where(and(inArray(caseWhatMatters.caseId, caseIds), inArray(caseWhatMatters.whatMattersTypeId, wmTypeIds)));
  const asksByCaseType = new Map(askRows.map((a) => [`${a.caseId}:${a.whatMattersTypeId}`, a]));

  const wmTypes = await db.select({ id: whatMattersTypes.id, label: whatMattersTypes.label })
    .from(whatMattersTypes).where(eq(whatMattersTypes.studyId, studyId));
  const wmLabelById = new Map(wmTypes.map((w) => [w.id, w.label]));

  const rows: AskDeliveryRow[] = [];
  for (const f of fields.sort((a, b) => a.decisionSort - b.decisionSort || a.sortOrder - b.sortOrder)) {
    let n = 0;
    let metCount = 0;
    let notCaptured = 0;
    let lateCount = 0;
    let lateDaysSum = 0;
    let diffMonthsSum = 0;
    let diffMonthsN = 0;
    let overCount = 0;
    let overAmountSum = 0;
    // Iterate COMPLETED-milestone cases: a milestone completed without a value
    // for this subquestion still counts — as notCaptured, when the ask exists.
    for (const caseId of completedCasesByMs.get(f.milestoneId) ?? []) {
      const ask = asksByCaseType.get(`${caseId}:${f.linkedWhatMattersTypeId}`);
      if (!ask) continue;
      const v = valuesByCaseField.get(`${caseId}:${f.id}`);
      const verdict = askVerdict(f.kind, {
        targetDate: ask.targetDate,
        amountSpecific: ask.amountSpecific,
        amountMin: ask.amountMin,
        amountMax: ask.amountMax,
        termYears: ask.termYears,
        termMonths: ask.termMonths,
      }, {
        valueNumber: v?.valueNumber ?? null,
        valueDate: v?.valueDate ?? null,
        valueYears: v?.valueYears ?? null,
        valueMonths: v?.valueMonths ?? null,
      });
      if (!verdict.comparable) continue; // ask in a shape this field can't compare
      if (verdict.met === null) {
        notCaptured += 1;
        continue;
      }
      n += 1;
      if (verdict.met) metCount += 1;
      else if (f.kind === 'date' && verdict.diffDays !== null) {
        lateCount += 1;
        lateDaysSum += verdict.diffDays;
      } else if (f.kind === 'duration' && verdict.diffMonths !== null) {
        diffMonthsSum += Math.abs(verdict.diffMonths);
        diffMonthsN += 1;
      } else if ((f.kind === 'amount' || f.kind === 'number' || f.kind === 'currency') && verdict.diffAmount !== null && verdict.diffAmount > 0) {
        overCount += 1;
        overAmountSum += verdict.diffAmount;
      }
    }
    // A field with ONLY uncaptured cases must surface — that's the point.
    if (n === 0 && notCaptured === 0) continue;
    rows.push({
      fieldId: f.id,
      fieldLabel: f.label,
      decisionLabel: f.decisionLabel,
      whatMattersTypeId: f.linkedWhatMattersTypeId!,
      whatMattersLabel: wmLabelById.get(f.linkedWhatMattersTypeId!) ?? '',
      kind: f.kind,
      n,
      metCount,
      notCaptured,
      lateCount,
      avgDaysLate: lateCount > 0 ? Math.round((lateDaysSum / lateCount) * 10) / 10 : null,
      avgDiffMonths: diffMonthsN > 0 ? Math.round((diffMonthsSum / diffMonthsN) * 10) / 10 : null,
      overCount,
      avgAmountOver: overCount > 0 ? Math.round(overAmountSum / overCount) : null,
    });
  }
  return rows;
}

// --- Budget capability (2026-07-05) -----------------------------------------
// Signed budget variance per case, in answeredAt order, per amount-kind linked
// field. Same scoping as getAskDeliveryData (P2BS on the case's primary life
// problem, from/to on the milestone's reachedAt). Only cases where BOTH the
// budget cap and the delivered amount exist — notCaptured stays the Ask
// delivery card's business. XmR stats are computed client-side because the
// unit toggle (% of budget vs amount) changes the value series.
const AMOUNT_KINDS = ['amount', 'number', 'currency'] as const;

export async function getBudgetCapability(studyId: string, from?: Date, to?: Date, valueDemands?: string[]): Promise<BudgetCapabilityField[]> {
  const fields = await db
    .select({
      id: subquestions.id,
      label: subquestions.label,
      kind: subquestions.kind,
      milestoneId: subquestions.milestoneId,
      linkedWhatMattersTypeId: subquestions.linkedWhatMattersTypeId,
      currencyCode: subquestions.currencyCode,
      sortOrder: subquestions.sortOrder,
      decisionLabel: milestones.label,
      decisionSort: milestones.sortOrder,
    })
    .from(subquestions)
    .innerJoin(milestones, eq(subquestions.milestoneId, milestones.id))
    .where(and(
      eq(milestones.studyId, studyId),
      isNotNull(subquestions.linkedWhatMattersTypeId),
      inArray(subquestions.kind, [...AMOUNT_KINDS]),
    ));
  if (fields.length === 0) return [];

  const caseWhere = await valueDemandCaseWhere(studyId, valueDemands);
  const caseRows = await db.select({ id: cases.id, caseRef: cases.caseRef }).from(cases).where(caseWhere);
  if (caseRows.length === 0) return [];
  const caseIds = caseRows.map((c) => c.id);
  const caseRefById = new Map(caseRows.map((c) => [c.id, c.caseRef]));

  const msIds = [...new Set(fields.map((f) => f.milestoneId))];
  const wmTypeIds = [...new Set(fields.map((f) => f.linkedWhatMattersTypeId!))];

  const msConds = [inArray(caseMilestones.caseId, caseIds), inArray(caseMilestones.milestoneId, msIds)];
  if (from) msConds.push(gte(caseMilestones.reachedAt, from));
  if (to) msConds.push(lte(caseMilestones.reachedAt, to));
  const msRows = await db.select({ caseId: caseMilestones.caseId, milestoneId: caseMilestones.milestoneId })
    .from(caseMilestones).where(and(...msConds));
  const completedCasesByMs = new Map<string, string[]>();
  for (const m of msRows) {
    const list = completedCasesByMs.get(m.milestoneId) ?? [];
    list.push(m.caseId);
    completedCasesByMs.set(m.milestoneId, list);
  }

  const valueRows = await db.select().from(caseSubquestionAnswers)
    .where(and(inArray(caseSubquestionAnswers.caseId, caseIds), inArray(caseSubquestionAnswers.subquestionId, fields.map((f) => f.id))));
  const valuesByCaseField = new Map(valueRows.map((v) => [`${v.caseId}:${v.subquestionId}`, v]));
  const askRows = await db.select().from(caseWhatMatters)
    .where(and(inArray(caseWhatMatters.caseId, caseIds), inArray(caseWhatMatters.whatMattersTypeId, wmTypeIds)));
  const asksByCaseType = new Map(askRows.map((a) => [`${a.caseId}:${a.whatMattersTypeId}`, a]));

  const wmTypes = await db.select({ id: whatMattersTypes.id, label: whatMattersTypes.label })
    .from(whatMattersTypes).where(eq(whatMattersTypes.studyId, studyId));
  const wmLabelById = new Map(wmTypes.map((w) => [w.id, w.label]));

  const out: BudgetCapabilityField[] = [];
  for (const f of fields.sort((a, b) => a.decisionSort - b.decisionSort || a.sortOrder - b.sortOrder)) {
    const points: BudgetCapabilityPoint[] = [];
    for (const caseId of completedCasesByMs.get(f.milestoneId) ?? []) {
      const ask = asksByCaseType.get(`${caseId}:${f.linkedWhatMattersTypeId}`);
      if (!ask) continue;
      const v = valuesByCaseField.get(`${caseId}:${f.id}`);
      if (!v || v.valueNumber == null) continue; // no delivered amount — Ask delivery surfaces the miss
      const verdict = askVerdict(f.kind, {
        targetDate: ask.targetDate,
        amountSpecific: ask.amountSpecific,
        amountMin: ask.amountMin,
        amountMax: ask.amountMax,
        termYears: ask.termYears,
        termMonths: ask.termMonths,
      }, { valueNumber: v.valueNumber, valueDate: null, valueYears: null, valueMonths: null });
      if (!verdict.comparable || verdict.diffAmount == null) continue;
      const cap = ask.amountSpecific ?? ask.amountMax!; // non-null when diffAmount != null (ask-verdict.ts)
      points.push({
        caseId,
        caseRef: caseRefById.get(caseId) ?? '',
        answeredAt: v.answeredAt.toISOString(),
        cap,
        delivered: v.valueNumber,
        diffAmount: verdict.diffAmount,
        diffPct: cap > 0 ? Math.round((verdict.diffAmount / cap) * 1000) / 10 : null,
      });
    }
    if (points.length === 0) continue; // self-hiding: comparable cases only
    points.sort((a, b) => a.answeredAt.localeCompare(b.answeredAt) || a.caseRef.localeCompare(b.caseRef));
    const overCount = points.filter((p) => p.diffAmount > 0).length;
    out.push({
      fieldId: f.id,
      fieldLabel: f.label,
      decisionLabel: f.decisionLabel,
      whatMattersTypeId: f.linkedWhatMattersTypeId!,
      whatMattersLabel: wmLabelById.get(f.linkedWhatMattersTypeId!) ?? '',
      kind: f.kind as BudgetCapabilityField['kind'],
      currencyCode: f.currencyCode,
      points,
      summary: {
        n: points.length,
        underCount: points.filter((p) => p.diffAmount < 0).length,
        metExactCount: points.filter((p) => p.diffAmount === 0).length,
        overCount,
        withinCount: points.length - overCount,
      },
    });
  }
  return out;
}
