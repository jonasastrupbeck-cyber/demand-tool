import { db } from './db';
import { demandEntries, handlingTypes, demandTypes, contactMethods, pointsOfTransaction, whatMattersTypes, workTypes, studies } from './schema';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import type { DashboardData } from '@/types';

export async function getDashboardData(studyId: string, from?: Date, to?: Date): Promise<DashboardData> {
  const baseConditions = [eq(demandEntries.studyId, studyId)];
  if (from) baseConditions.push(gte(demandEntries.createdAt, from));
  if (to) baseConditions.push(lte(demandEntries.createdAt, to));

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

  // ── DEMAND AGGREGATIONS ──

  // Total counts by classification (demand only)
  const classificationCounts = await db.select({
    classification: demandEntries.classification,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .where(demandWhere)
    .groupBy(demandEntries.classification);

  const valueCount = classificationCounts.find(c => c.classification === 'value')?.count || 0;
  const failureCount = classificationCounts.find(c => c.classification === 'failure')?.count || 0;
  const unknownCount = classificationCounts.find(c => c.classification === 'unknown')?.count || 0;
  const totalEntries = valueCount + failureCount + unknownCount;

  // Perfect percentage: value demand with one-stop handling as % of total demand
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

  // Demand type counts (top 10)
  const demandTypeCounts = await db.select({
    label: demandTypes.label,
    category: demandTypes.category,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(demandTypes, eq(demandEntries.demandTypeId, demandTypes.id))
    .where(demandWhere)
    .groupBy(demandTypes.label, demandTypes.category)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Handling type counts (demand only)
  const handlingTypeCounts = await db.select({
    label: handlingTypes.label,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(handlingTypes, eq(demandEntries.handlingTypeId, handlingTypes.id))
    .where(demandWhere)
    .groupBy(handlingTypes.label)
    .orderBy(desc(sql`count(*)`));

  // Contact method counts (demand only)
  const contactMethodCounts = await db.select({
    label: contactMethods.label,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(contactMethods, eq(demandEntries.contactMethodId, contactMethods.id))
    .where(demandWhere)
    .groupBy(contactMethods.label)
    .orderBy(desc(sql`count(*)`));

  // What matters type counts (demand only)
  const whatMattersCounts = await db.select({
    label: whatMattersTypes.label,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(whatMattersTypes, eq(demandEntries.whatMattersTypeId, whatMattersTypes.id))
    .where(demandWhere)
    .groupBy(whatMattersTypes.label)
    .orderBy(desc(sql`count(*)`));

  // Handling by classification (demand only)
  const handlingByClass = await db.select({
    label: handlingTypes.label,
    classification: demandEntries.classification,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(handlingTypes, eq(demandEntries.handlingTypeId, handlingTypes.id))
    .where(demandWhere)
    .groupBy(handlingTypes.label, demandEntries.classification);

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

  // Demand over time (demand only)
  const demandOverTime = await db.select({
    date: sql<string>`${demandEntries.createdAt}::date`,
    classification: demandEntries.classification,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .where(demandWhere)
    .groupBy(sql`${demandEntries.createdAt}::date`, demandEntries.classification)
    .orderBy(sql`${demandEntries.createdAt}::date`);

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

  // Failure causes (demand only)
  const failureCauses = await db.select({
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
    .limit(15);

  // Failures by original value demand type (demand only)
  const failuresByOriginalValueDemand = await db.select({
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
    .orderBy(desc(sql`count(*)`));

  // Point of transaction by classification (demand only)
  const potByClass = await db.select({
    label: pointsOfTransaction.label,
    classification: demandEntries.classification,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(pointsOfTransaction, eq(demandEntries.pointOfTransactionId, pointsOfTransaction.id))
    .where(demandWhere)
    .groupBy(pointsOfTransaction.label, demandEntries.classification);

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

  // What matters free-text notes (demand only)
  const whatMattersNotes = await db.select({
    text: demandEntries.whatMatters,
    date: sql<string>`${demandEntries.createdAt}::date`,
  })
    .from(demandEntries)
    .where(and(
      ...demandConditions,
      sql`${demandEntries.whatMatters} IS NOT NULL AND ${demandEntries.whatMatters} != ''`
    ))
    .orderBy(desc(demandEntries.createdAt));

  // Collector stats (all entries — demand + work)
  const allWhere = and(...baseConditions);
  const collectorStats = await db.select({
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
    .orderBy(desc(sql`count(*)`));

  const collectorCounts = collectorStats.map(r => ({ name: r.name!, count: r.count, lastActive: r.lastActive }));

  // ── WORK AGGREGATIONS ──

  let workCount = 0;
  let workValueCount = 0;
  let workFailureCount = 0;
  let workUnknownCount = 0;
  let workTypeCounts: Array<{ label: string; count: number }> = [];
  let workOverTime: Array<{ date: string; valueCount: number; failureCount: number; unknownCount: number }> = [];

  if (workTrackingEnabled) {
    const workClassCounts = await db.select({
      classification: demandEntries.classification,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .where(workWhere)
      .groupBy(demandEntries.classification);

    workValueCount = workClassCounts.find(c => c.classification === 'value')?.count || 0;
    workFailureCount = workClassCounts.find(c => c.classification === 'failure')?.count || 0;
    workUnknownCount = workClassCounts.find(c => c.classification === 'unknown')?.count || 0;
    workCount = workValueCount + workFailureCount + workUnknownCount;

    // Work type counts
    workTypeCounts = await db.select({
      label: workTypes.label,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .innerJoin(workTypes, eq(demandEntries.workTypeId, workTypes.id))
      .where(workWhere)
      .groupBy(workTypes.label)
      .orderBy(desc(sql`count(*)`));

    // Work over time
    const workOT = await db.select({
      date: sql<string>`${demandEntries.createdAt}::date`,
      classification: demandEntries.classification,
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .where(workWhere)
      .groupBy(sql`${demandEntries.createdAt}::date`, demandEntries.classification)
      .orderBy(sql`${demandEntries.createdAt}::date`);

    const workTimeMap = new Map<string, { valueCount: number; failureCount: number; unknownCount: number }>();
    for (const row of workOT) {
      if (!workTimeMap.has(row.date)) {
        workTimeMap.set(row.date, { valueCount: 0, failureCount: 0, unknownCount: 0 });
      }
      const entry = workTimeMap.get(row.date)!;
      if (row.classification === 'value') entry.valueCount = row.count;
      else if (row.classification === 'failure') entry.failureCount = row.count;
      else entry.unknownCount = row.count;
    }
    workOverTime = Array.from(workTimeMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }

  return {
    totalEntries,
    valueCount,
    failureCount,
    unknownCount,
    perfectPercentage,
    demandTypeCounts,
    handlingTypeCounts,
    contactMethodCounts,
    whatMattersCounts,
    handlingByClassification,
    pointOfTransactionByClassification,
    demandOverTime: demandOverTimeResult,
    failureCauses: failureCauses.map(r => ({ cause: r.cause!, count: r.count })),
    failuresByOriginalValueDemand,
    whatMattersNotes: whatMattersNotes.map(r => ({ text: r.text!, date: r.date })),
    collectorCounts,
    workCount,
    workValueCount,
    workFailureCount,
    workUnknownCount,
    workTypeCounts,
    workOverTime,
  };
}
