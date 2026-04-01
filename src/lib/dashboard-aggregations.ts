import { db } from './db';
import { demandEntries, handlingTypes, demandTypes, contactMethods, pointsOfTransaction, whatMattersTypes, studies } from './schema';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import type { DashboardData } from '@/types';

export async function getDashboardData(studyId: string, from?: Date, to?: Date): Promise<DashboardData> {
  const conditions = [eq(demandEntries.studyId, studyId)];
  if (from) conditions.push(gte(demandEntries.createdAt, from));
  if (to) conditions.push(lte(demandEntries.createdAt, to));
  const whereClause = and(...conditions);

  // Get study for one-stop handling type
  const study = await db.select().from(studies).where(eq(studies.id, studyId));
  const oneStopId = study[0]?.oneStopHandlingType;

  // Total counts by classification
  const classificationCounts = await db.select({
    classification: demandEntries.classification,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .where(whereClause)
    .groupBy(demandEntries.classification);

  const valueCount = classificationCounts.find(c => c.classification === 'value')?.count || 0;
  const failureCount = classificationCounts.find(c => c.classification === 'failure')?.count || 0;
  const totalEntries = valueCount + failureCount;

  // Perfect percentage: value demand with one-stop handling as % of total demand
  let perfectPercentage = 0;
  if (oneStopId && totalEntries > 0) {
    const perfectCount = await db.select({
      count: sql<number>`count(*)::int`,
    })
      .from(demandEntries)
      .where(and(
        ...conditions,
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
    .where(whereClause)
    .groupBy(demandTypes.label, demandTypes.category)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Handling type counts
  const handlingTypeCounts = await db.select({
    label: handlingTypes.label,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(handlingTypes, eq(demandEntries.handlingTypeId, handlingTypes.id))
    .where(whereClause)
    .groupBy(handlingTypes.label)
    .orderBy(desc(sql`count(*)`));

  // Contact method counts
  const contactMethodCounts = await db.select({
    label: contactMethods.label,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(contactMethods, eq(demandEntries.contactMethodId, contactMethods.id))
    .where(whereClause)
    .groupBy(contactMethods.label)
    .orderBy(desc(sql`count(*)`));

  // What matters type counts
  const whatMattersCounts = await db.select({
    label: whatMattersTypes.label,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(whatMattersTypes, eq(demandEntries.whatMattersTypeId, whatMattersTypes.id))
    .where(whereClause)
    .groupBy(whatMattersTypes.label)
    .orderBy(desc(sql`count(*)`));

  // Handling by classification
  const handlingByClass = await db.select({
    label: handlingTypes.label,
    classification: demandEntries.classification,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(handlingTypes, eq(demandEntries.handlingTypeId, handlingTypes.id))
    .where(whereClause)
    .groupBy(handlingTypes.label, demandEntries.classification);

  const handlingMap = new Map<string, { valueCount: number; failureCount: number }>();
  for (const row of handlingByClass) {
    if (!handlingMap.has(row.label)) {
      handlingMap.set(row.label, { valueCount: 0, failureCount: 0 });
    }
    const entry = handlingMap.get(row.label)!;
    if (row.classification === 'value') entry.valueCount = row.count;
    else entry.failureCount = row.count;
  }
  const handlingByClassification = Array.from(handlingMap.entries()).map(([label, counts]) => ({
    label,
    ...counts,
  }));

  // Demand over time
  const demandOverTime = await db.select({
    date: sql<string>`${demandEntries.createdAt}::date`,
    classification: demandEntries.classification,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .where(whereClause)
    .groupBy(sql`${demandEntries.createdAt}::date`, demandEntries.classification)
    .orderBy(sql`${demandEntries.createdAt}::date`);

  const timeMap = new Map<string, { valueCount: number; failureCount: number }>();
  for (const row of demandOverTime) {
    if (!timeMap.has(row.date)) {
      timeMap.set(row.date, { valueCount: 0, failureCount: 0 });
    }
    const entry = timeMap.get(row.date)!;
    if (row.classification === 'value') entry.valueCount = row.count;
    else entry.failureCount = row.count;
  }
  const demandOverTimeResult = Array.from(timeMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  // Failure causes
  const failureCauses = await db.select({
    cause: demandEntries.failureCause,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .where(and(
      ...conditions,
      eq(demandEntries.classification, 'failure'),
      sql`${demandEntries.failureCause} IS NOT NULL AND ${demandEntries.failureCause} != ''`
    ))
    .groupBy(demandEntries.failureCause)
    .orderBy(desc(sql`count(*)`))
    .limit(15);

  // Failures by original value demand type
  const failuresByOriginalValueDemand = await db.select({
    label: demandTypes.label,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(demandTypes, eq(demandEntries.originalValueDemandTypeId, demandTypes.id))
    .where(and(
      ...conditions,
      eq(demandEntries.classification, 'failure'),
    ))
    .groupBy(demandTypes.label)
    .orderBy(desc(sql`count(*)`));

  // Point of transaction by classification
  const potByClass = await db.select({
    label: pointsOfTransaction.label,
    classification: demandEntries.classification,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .innerJoin(pointsOfTransaction, eq(demandEntries.pointOfTransactionId, pointsOfTransaction.id))
    .where(whereClause)
    .groupBy(pointsOfTransaction.label, demandEntries.classification);

  const potMap = new Map<string, { valueCount: number; failureCount: number }>();
  for (const row of potByClass) {
    if (!potMap.has(row.label)) {
      potMap.set(row.label, { valueCount: 0, failureCount: 0 });
    }
    const entry = potMap.get(row.label)!;
    if (row.classification === 'value') entry.valueCount = row.count;
    else entry.failureCount = row.count;
  }
  const pointOfTransactionByClassification = Array.from(potMap.entries()).map(([label, counts]) => ({
    label,
    ...counts,
  }));

  // What matters free-text notes
  const whatMattersNotes = await db.select({
    text: demandEntries.whatMatters,
    date: sql<string>`${demandEntries.createdAt}::date`,
  })
    .from(demandEntries)
    .where(and(
      ...conditions,
      sql`${demandEntries.whatMatters} IS NOT NULL AND ${demandEntries.whatMatters} != ''`
    ))
    .orderBy(desc(demandEntries.createdAt));

  return {
    totalEntries,
    valueCount,
    failureCount,
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
  };
}
