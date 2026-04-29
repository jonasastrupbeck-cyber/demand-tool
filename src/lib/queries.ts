import { db } from './db';
import { studies, handlingTypes, demandTypes, contactMethods, pointsOfTransaction, workSources, whatMattersTypes, workTypes, workStepTypes, demandEntries, demandEntryWhatMatters, systemConditions, demandEntrySystemConditions, thinkings, demandEntryThinkings, demandEntryThinkingScs, lifecycleStages, lifeProblems, workDescriptionBlocks } from './schema';
import { eq, and, desc, asc, sql, gte, lte, isNull, inArray } from 'drizzle-orm';
import { generateId, generateAccessCode } from './utils';
import type { Locale } from './i18n';
import { STANDARD_LIFECYCLE_STAGES } from './ai/classify-lifecycle';

const DEFAULT_HANDLING_TYPES: Record<Locale, string[]> = {
  en: [
    'One Stop',
    'Pass-on',
    'Pass-back',
  ],
  da: [
    'One Stop',
    'Sendt videre',
    'Sendt tilbage',
  ],
  sv: [
    'One Stop',
    'Skickat vidare',
    'Skickat tillbaka',
  ],
  de: [
    'One Stop',
    'Weitergeleitet',
    'Zurückgeleitet',
  ],
};

const DEFAULT_VALUE_TYPES: Record<Locale, string[]> = {
  en: [
    'Request for information',
    'Request for service',
    'New application/order',
  ],
  da: [
    'Foresp\u00f8rgsel om information',
    'Foresp\u00f8rgsel om service',
    'Ny ans\u00f8gning/ordre',
  ],
  sv: [
    'F\u00f6rfr\u00e5gan om information',
    'F\u00f6rfr\u00e5gan om tj\u00e4nst',
    'Ny ans\u00f6kan/best\u00e4llning',
  ],
  de: [
    'Informationsanfrage',
    'Serviceanfrage',
    'Neuer Antrag/Bestellung',
  ],
};

const DEFAULT_FAILURE_TYPES: Record<Locale, string[]> = {
  en: [],
  da: [],
  sv: [],
  de: [],
};

const DEFAULT_CONTACT_METHODS: Record<Locale, string[]> = {
  en: ['Phone', 'Mail', 'Face2face'],
  da: ['Telefon', 'Mail', 'Personligt'],
  sv: ['Telefon', 'Mail', 'Personligt'],
  de: ['Telefon', 'Mail', 'Persönlich'],
};

const DEFAULT_WORK_TYPES: Record<Locale, string[]> = {
  en: ['Information request (internal)', 'Management reporting', 'Internal process query'],
  da: ['Informationsforespørgsel (intern)', 'Ledelsesrapportering', 'Intern procesforespørgsel'],
  sv: ['Informationsförfrågan (intern)', 'Ledningsrapportering', 'Intern processförfrågan'],
  de: ['Informationsanfrage (intern)', 'Management-Berichterstattung', 'Interne Prozessanfrage'],
};

export async function createStudy(name: string, description: string = '', locale: Locale = 'en', primaryContactMethod?: string, pointOfTransaction?: string, workTrackingEnabled: boolean = false, consultantPin?: string) {
  const id = generateId();
  let accessCode = generateAccessCode();

  // Check for collision
  const existing = await db.select().from(studies).where(eq(studies.accessCode, accessCode));
  if (existing.length > 0) {
    accessCode = generateAccessCode();
  }

  await db.insert(studies).values({
    id,
    accessCode,
    name,
    description,
    workTrackingEnabled,
    activeLayer: 1,
    consultantPin: consultantPin || null,
    createdAt: new Date(),
    isActive: true,
  });

  // Create default handling types in the chosen language
  const localizedHandling = DEFAULT_HANDLING_TYPES[locale];
  const handlingTypeIds: string[] = [];
  for (let i = 0; i < localizedHandling.length; i++) {
    const htId = generateId();
    handlingTypeIds.push(htId);
    await db.insert(handlingTypes).values({
      id: htId,
      studyId: id,
      label: localizedHandling[i],
      sortOrder: i,
    });
  }

  // Set first handling type as one-stop default
  await db.update(studies).set({ oneStopHandlingType: handlingTypeIds[0] }).where(eq(studies.id, id));

  // Create default demand types in the chosen language
  const localizedValue = DEFAULT_VALUE_TYPES[locale];
  for (let i = 0; i < localizedValue.length; i++) {
    await db.insert(demandTypes).values({
      id: generateId(),
      studyId: id,
      category: 'value',
      label: localizedValue[i],
      sortOrder: i,
    });
  }

  const localizedFailure = DEFAULT_FAILURE_TYPES[locale];
  for (let i = 0; i < localizedFailure.length; i++) {
    await db.insert(demandTypes).values({
      id: generateId(),
      studyId: id,
      category: 'failure',
      label: localizedFailure[i],
      sortOrder: i,
    });
  }

  // Create default contact methods in the chosen language
  const localizedContactMethods = DEFAULT_CONTACT_METHODS[locale];
  const contactMethodIds: { id: string; label: string }[] = [];
  for (let i = 0; i < localizedContactMethods.length; i++) {
    const cmId = generateId();
    contactMethodIds.push({ id: cmId, label: localizedContactMethods[i] });
    await db.insert(contactMethods).values({
      id: cmId,
      studyId: id,
      label: localizedContactMethods[i],
      sortOrder: i,
    });
  }

  // Handle primary contact method
  let primaryCmId: string | null = null;
  if (primaryContactMethod) {
    // Check if it matches one of the defaults
    const match = contactMethodIds.find(cm => cm.label.toLowerCase() === primaryContactMethod.toLowerCase());
    if (match) {
      primaryCmId = match.id;
    } else {
      // Custom contact method ("Andet"/Other) — add it as an extra method
      const customId = generateId();
      await db.insert(contactMethods).values({
        id: customId,
        studyId: id,
        label: primaryContactMethod,
        sortOrder: contactMethodIds.length,
      });
      primaryCmId = customId;
    }
    await db.update(studies).set({ primaryContactMethodId: primaryCmId }).where(eq(studies.id, id));
  }

  // Handle point of transaction
  if (pointOfTransaction) {
    const potId = generateId();
    await db.insert(pointsOfTransaction).values({
      id: potId,
      studyId: id,
      label: pointOfTransaction,
      sortOrder: 0,
    });
    await db.update(studies).set({ primaryPointOfTransactionId: potId }).where(eq(studies.id, id));
  }

  // Create default work types if work tracking is enabled
  if (workTrackingEnabled) {
    const localizedWorkTypes = DEFAULT_WORK_TYPES[locale];
    for (let i = 0; i < localizedWorkTypes.length; i++) {
      await db.insert(workTypes).values({
        id: generateId(),
        studyId: id,
        label: localizedWorkTypes[i],
        category: 'value',
        sortOrder: i,
      });
    }
  }

  return { id, accessCode };
}

export async function getStudyByCode(code: string) {
  const result = await db.select().from(studies).where(eq(studies.accessCode, code.toUpperCase()));
  return result[0] || null;
}

export async function updateStudy(id: string, data: Record<string, unknown>) {
  await db.update(studies).set(data).where(eq(studies.id, id));
}

export async function getHandlingTypes(studyId: string) {
  return db.select().from(handlingTypes).where(eq(handlingTypes.studyId, studyId)).orderBy(asc(handlingTypes.sortOrder));
}

export async function addHandlingType(studyId: string, label: string) {
  const id = generateId();
  const existing = await getHandlingTypes(studyId);
  const row = {
    id,
    studyId,
    label,
    operationalDefinition: null as string | null,
    sortOrder: existing.length,
  };
  await db.insert(handlingTypes).values(row);
  return row;
}

export async function updateHandlingType(id: string, data: { label?: string; operationalDefinition?: string | null }) {
  await db.update(handlingTypes).set(data).where(eq(handlingTypes.id, id));
}

export async function deleteHandlingType(id: string) {
  await db.delete(handlingTypes).where(eq(handlingTypes.id, id));
}

export async function getDemandTypes(studyId: string, category?: 'value' | 'failure') {
  if (category) {
    return db.select().from(demandTypes)
      .where(and(eq(demandTypes.studyId, studyId), eq(demandTypes.category, category)))
      .orderBy(asc(demandTypes.sortOrder));
  }
  return db.select().from(demandTypes).where(eq(demandTypes.studyId, studyId)).orderBy(asc(demandTypes.sortOrder));
}

export async function addDemandType(studyId: string, category: 'value' | 'failure', label: string) {
  const id = generateId();
  const existing = await getDemandTypes(studyId, category);
  const row = {
    id,
    studyId,
    category,
    label,
    operationalDefinition: null as string | null,
    sortOrder: existing.length,
  };
  await db.insert(demandTypes).values(row);
  return row;
}

export async function updateDemandType(id: string, data: { label?: string; operationalDefinition?: string | null }) {
  await db.update(demandTypes).set(data).where(eq(demandTypes.id, id));
}

export async function deleteDemandType(id: string) {
  await db.delete(demandTypes).where(eq(demandTypes.id, id));
}

export async function getContactMethods(studyId: string) {
  return db.select().from(contactMethods).where(eq(contactMethods.studyId, studyId)).orderBy(asc(contactMethods.sortOrder));
}

export async function addContactMethod(studyId: string, label: string) {
  const id = generateId();
  const existing = await getContactMethods(studyId);
  await db.insert(contactMethods).values({
    id,
    studyId,
    label,
    sortOrder: existing.length,
  });
  return id;
}

export async function updateContactMethod(id: string, data: { label?: string }) {
  await db.update(contactMethods).set(data).where(eq(contactMethods.id, id));
}

export async function deleteContactMethod(id: string) {
  await db.delete(contactMethods).where(eq(contactMethods.id, id));
}

export async function getWhatMattersTypes(studyId: string) {
  return db.select().from(whatMattersTypes).where(eq(whatMattersTypes.studyId, studyId)).orderBy(asc(whatMattersTypes.sortOrder));
}

export async function addWhatMattersType(studyId: string, label: string) {
  const id = generateId();
  const existing = await getWhatMattersTypes(studyId);
  const row = {
    id,
    studyId,
    label,
    operationalDefinition: null as string | null,
    sortOrder: existing.length,
  };
  await db.insert(whatMattersTypes).values(row);
  return row;
}

export async function updateWhatMattersType(id: string, data: { label?: string; operationalDefinition?: string | null }) {
  await db.update(whatMattersTypes).set(data).where(eq(whatMattersTypes.id, id));
}

export async function deleteWhatMattersType(id: string) {
  await db.delete(whatMattersTypes).where(eq(whatMattersTypes.id, id));
}

// --- Life Problems (Phase 2 item 1: "Life Problem To Be Solved") ---

export async function getLifeProblems(studyId: string) {
  return db.select().from(lifeProblems).where(eq(lifeProblems.studyId, studyId)).orderBy(asc(lifeProblems.sortOrder));
}

export async function addLifeProblem(studyId: string, label: string) {
  const id = generateId();
  const existing = await getLifeProblems(studyId);
  const row = {
    id,
    studyId,
    label,
    operationalDefinition: null as string | null,
    sortOrder: existing.length,
  };
  await db.insert(lifeProblems).values(row);
  return row;
}

export async function updateLifeProblem(id: string, data: { label?: string; operationalDefinition?: string | null }) {
  await db.update(lifeProblems).set(data).where(eq(lifeProblems.id, id));
}

export async function deleteLifeProblem(id: string) {
  await db.delete(lifeProblems).where(eq(lifeProblems.id, id));
}

// --- System Conditions ---

export async function getSystemConditions(studyId: string) {
  return db.select().from(systemConditions).where(eq(systemConditions.studyId, studyId)).orderBy(asc(systemConditions.sortOrder));
}

export async function addSystemCondition(studyId: string, label: string) {
  const id = generateId();
  const existing = await getSystemConditions(studyId);
  const row = {
    id,
    studyId,
    label,
    operationalDefinition: null as string | null,
    sortOrder: existing.length,
  };
  await db.insert(systemConditions).values(row);
  return row;
}

export async function updateSystemCondition(id: string, data: { label?: string; operationalDefinition?: string | null }) {
  await db.update(systemConditions).set(data).where(eq(systemConditions.id, id));
}

export async function deleteSystemCondition(id: string) {
  await db.delete(systemConditions).where(eq(systemConditions.id, id));
}

export async function getSystemConditionsForEntries(entryIds: string[]) {
  if (entryIds.length === 0) return [];
  return db.select().from(demandEntrySystemConditions)
    .where(inArray(demandEntrySystemConditions.demandEntryId, entryIds));
}

export async function getSystemConditionsForEntry(entryId: string) {
  return db.select().from(demandEntrySystemConditions)
    .where(eq(demandEntrySystemConditions.demandEntryId, entryId));
}

// --- Thinkings (mirrors System Conditions) ---

export async function getThinkings(studyId: string) {
  return db.select().from(thinkings).where(eq(thinkings.studyId, studyId)).orderBy(asc(thinkings.sortOrder));
}

export async function addThinking(studyId: string, label: string) {
  const id = generateId();
  const existing = await getThinkings(studyId);
  const row = {
    id,
    studyId,
    label,
    operationalDefinition: null as string | null,
    sortOrder: existing.length,
  };
  await db.insert(thinkings).values(row);
  return row;
}

export async function updateThinking(id: string, data: { label?: string; operationalDefinition?: string | null }) {
  await db.update(thinkings).set(data).where(eq(thinkings.id, id));
}

export async function deleteThinking(id: string) {
  await db.delete(thinkings).where(eq(thinkings.id, id));
}

export async function getThinkingsForEntries(entryIds: string[]) {
  if (entryIds.length === 0) return [];
  return db.select().from(demandEntryThinkings)
    .where(inArray(demandEntryThinkings.demandEntryId, entryIds));
}

export async function getThinkingsForEntry(entryId: string) {
  return db.select().from(demandEntryThinkings)
    .where(eq(demandEntryThinkings.demandEntryId, entryId));
}

// Per-migration-0011: attachments from each thinking on an entry to SCs on the
// same entry, with a helps/hinders dimension.
export async function getThinkingScAttachmentsForEntry(entryId: string) {
  return db.select().from(demandEntryThinkingScs)
    .where(eq(demandEntryThinkingScs.demandEntryId, entryId));
}

export async function getThinkingScAttachmentsForEntries(entryIds: string[]) {
  if (entryIds.length === 0) return [];
  return db.select().from(demandEntryThinkingScs)
    .where(inArray(demandEntryThinkingScs.demandEntryId, entryIds));
}

export async function getPointsOfTransaction(studyId: string) {
  return db.select().from(pointsOfTransaction).where(eq(pointsOfTransaction.studyId, studyId)).orderBy(asc(pointsOfTransaction.sortOrder));
}

export async function addPointOfTransaction(studyId: string, label: string) {
  const id = generateId();
  const existing = await getPointsOfTransaction(studyId);
  await db.insert(pointsOfTransaction).values({
    id,
    studyId,
    label,
    sortOrder: existing.length,
  });
  return id;
}

export async function deletePointOfTransaction(id: string) {
  await db.delete(pointsOfTransaction).where(eq(pointsOfTransaction.id, id));
}

export async function updatePointOfTransaction(id: string, data: { label?: string; customerFacing?: boolean }) {
  await db.update(pointsOfTransaction).set(data).where(eq(pointsOfTransaction.id, id));
}

// Work sources — mirrors points-of-transaction queries (migration 0015).

export async function getWorkSources(studyId: string) {
  return db.select().from(workSources).where(eq(workSources.studyId, studyId)).orderBy(asc(workSources.sortOrder));
}

export async function addWorkSource(studyId: string, label: string) {
  const id = generateId();
  const existing = await getWorkSources(studyId);
  await db.insert(workSources).values({
    id,
    studyId,
    label,
    sortOrder: existing.length,
  });
  return id;
}

export async function deleteWorkSource(id: string) {
  await db.delete(workSources).where(eq(workSources.id, id));
}

export async function updateWorkSource(id: string, data: { label?: string; customerFacing?: boolean }) {
  await db.update(workSources).set(data).where(eq(workSources.id, id));
}

export async function getWorkTypes(studyId: string) {
  return db.select().from(workTypes).where(eq(workTypes.studyId, studyId)).orderBy(asc(workTypes.sortOrder));
}

export async function addWorkType(studyId: string, label: string, category: 'value' | 'failure' | 'sequence') {
  const id = generateId();
  const existing = await getWorkTypes(studyId);
  const row = {
    id,
    studyId,
    label,
    category,
    sortOrder: existing.length,
  };
  await db.insert(workTypes).values(row);
  return row;
}

export async function updateWorkType(id: string, data: { label?: string; category?: 'value' | 'failure' | 'sequence' }) {
  await db.update(workTypes).set(data).where(eq(workTypes.id, id));
}

export async function deleteWorkType(id: string) {
  await db.delete(workTypes).where(eq(workTypes.id, id));
}

// --- Work Step Types (Phase 4 / 2026-04-16) ---
// Managed taxonomy for Flow block step descriptions. Tag fixed at taxonomy level.

export async function getWorkStepTypes(studyId: string) {
  return db.select().from(workStepTypes).where(eq(workStepTypes.studyId, studyId)).orderBy(asc(workStepTypes.sortOrder));
}

export async function addWorkStepType(studyId: string, label: string, tag: 'value' | 'sequence' | 'failure') {
  const id = generateId();
  const existing = await getWorkStepTypes(studyId);
  await db.insert(workStepTypes).values({
    id,
    studyId,
    label,
    tag,
    sortOrder: existing.length,
  });
  return id;
}

export async function updateWorkStepType(id: string, data: { label?: string; tag?: 'value' | 'sequence' | 'failure'; operationalDefinition?: string | null }) {
  await db.update(workStepTypes).set(data).where(eq(workStepTypes.id, id));
}

export async function deleteWorkStepType(id: string) {
  // FK on work_description_blocks is ON DELETE SET NULL so referencing blocks
  // revert to free-text automatically (text + tag preserved).
  await db.delete(workStepTypes).where(eq(workStepTypes.id, id));
}

// Phase 4B (2026-04-16) — synthesis helper support.
// Returns all orphan free-text work blocks in a study (those with no step FK
// and non-empty text) — the input to clusterBlocks().
export async function getOrphanWorkBlocks(studyId: string) {
  const rows = await db.select({
    id: workDescriptionBlocks.id,
    text: workDescriptionBlocks.text,
    tag: workDescriptionBlocks.tag,
  })
    .from(workDescriptionBlocks)
    .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
    .where(and(
      eq(demandEntries.studyId, studyId),
      isNull(workDescriptionBlocks.workStepTypeId),
      sql`${workDescriptionBlocks.text} != ''`,
    ));
  return rows;
}

// Promote a cluster to a new Work Step Type and bulk-update the matching
// blocks. Safe to call against block IDs outside this study — the UPDATE is
// already scoped to the cluster's own IDs which came from the same study's
// orphan pool.
export async function promoteWorkStepFromCluster(studyId: string, payload: {
  label: string;
  tag: 'value' | 'sequence' | 'failure';
  operationalDefinition?: string;
  blockIds: string[];
}) {
  const id = generateId();
  const existing = await getWorkStepTypes(studyId);
  await db.insert(workStepTypes).values({
    id,
    studyId,
    label: payload.label,
    tag: payload.tag,
    operationalDefinition: payload.operationalDefinition ?? null,
    sortOrder: existing.length,
  });
  if (payload.blockIds.length > 0) {
    await db.update(workDescriptionBlocks)
      .set({ workStepTypeId: id })
      .where(inArray(workDescriptionBlocks.id, payload.blockIds));
  }
  return id;
}

export async function seedDefaultWorkTypes(studyId: string, locale: Locale = 'en') {
  const existing = await getWorkTypes(studyId);
  if (existing.length > 0) return;
  const localizedWorkTypes = DEFAULT_WORK_TYPES[locale];
  for (let i = 0; i < localizedWorkTypes.length; i++) {
    await db.insert(workTypes).values({
      id: generateId(),
      studyId,
      label: localizedWorkTypes[i],
      category: 'value',
      sortOrder: i,
    });
  }
}

function concatWorkBlocks(blocks: { tag: 'value' | 'sequence' | 'failure'; text: string }[]): string {
  return blocks
    .filter(b => b.text && b.text.trim().length > 0)
    .map(b => `[${b.tag}] ${b.text}`)
    .join('\n\n');
}

export async function createEntry(studyId: string, data: {
  verbatim: string;
  classification: 'value' | 'failure' | 'unknown' | 'sequence';
  entryType?: 'demand' | 'work';
  handlingTypeId?: string;
  demandTypeId?: string;
  contactMethodId?: string;
  pointOfTransactionId?: string;
  workSourceId?: string;
  whatMattersTypeId?: string;
  whatMattersTypeIds?: string[];
  systemConditions?: {
    id: string;
    dimension: 'helps' | 'hinders';
    // Per Ali feedback 2026-04-16: each SC attaches to one or more of the
    // five capture fields (LP2BS, Demand, What Matters, CoR, Work).
    attachesToLifeProblem?: boolean;
    attachesToDemand?: boolean;
    attachesToWhatMatters?: boolean;
    attachesToCor?: boolean;
    attachesToWork?: boolean;
  }[];
  thinkings?: { id: string; logic: string; dimension?: 'helps' | 'hinders'; scAttachments?: { systemConditionId: string }[] }[];
  originalValueDemandTypeId?: string;
  workTypeId?: string;
  workTypeFreeText?: string;
  linkedValueDemandEntryId?: string;
  failureCause?: string;
  whatMatters?: string;
  collectorName?: string;
  lifeProblemId?: string | null;
  // Phase 4 (2026-04-16): optional `workStepTypeId` links a block to a
  // managed Work Step Type. Null/undefined = free-text block (current behaviour).
  workBlocks?: { tag: 'value' | 'sequence' | 'failure'; text: string; workStepTypeId?: string | null }[];
}, createdAt?: Date) {
  const id = generateId();
  const entryType = data.entryType || 'demand';
  const isDemand = entryType === 'demand';
  // For work entries with blocks, the verbatim column is the concatenated block text
  // so existing verbatim consumers (search, export, dashboard list, etc.) keep working.
  const workBlocks = !isDemand ? (data.workBlocks || []) : [];
  const verbatimToStore = workBlocks.length > 0 ? concatWorkBlocks(workBlocks) : data.verbatim;
  await db.insert(demandEntries).values({
    id,
    studyId,
    createdAt: createdAt || new Date(),
    verbatim: verbatimToStore,
    classification: data.classification,
    entryType,
    handlingTypeId: data.handlingTypeId || null,
    demandTypeId: isDemand ? (data.demandTypeId || null) : null,
    contactMethodId: data.contactMethodId || null,
    pointOfTransactionId: data.pointOfTransactionId || null,
    workSourceId: !isDemand ? (data.workSourceId || null) : null,
    whatMattersTypeId: isDemand ? (data.whatMattersTypeId || null) : null,
    lifeProblemId: isDemand ? (data.lifeProblemId || null) : null,
    originalValueDemandTypeId: isDemand && data.classification === 'failure' ? (data.originalValueDemandTypeId || null) : null,
    workTypeId: !isDemand ? (data.workTypeId || null) : null,
    workTypeFreeText: !isDemand && data.classification === 'unknown' ? (data.workTypeFreeText || null) : null,
    linkedValueDemandEntryId: isDemand && data.classification === 'failure' ? (data.linkedValueDemandEntryId || null) : null,
    failureCause: isDemand && data.classification === 'failure' ? (data.failureCause || null) : null,
    whatMatters: isDemand ? (data.whatMatters || null) : null,
    collectorName: data.collectorName || null,
  });

  // Insert what matters junction records
  const whatMattersIds = data.whatMattersTypeIds || (data.whatMattersTypeId ? [data.whatMattersTypeId] : []);
  if (isDemand && whatMattersIds.length > 0) {
    for (const wmtId of whatMattersIds) {
      await db.insert(demandEntryWhatMatters).values({
        id: generateId(),
        demandEntryId: id,
        whatMattersTypeId: wmtId,
      });
    }
  }

  // Insert system condition junction records.
  // Per Ali feedback 2026-04-16: failure work can be hidden inside ANY outcome,
  // so SC is accepted on every classified entry (mirrors the UI gate in
  // capture/page.tsx and EntryEditModal.tsx). Only rejected when classification
  // is unset or 'unknown'.
  // Each entry carries a "dimension" (helps | hinders) — Phase 2 / Item 3.
  const scs = data.systemConditions || [];
  const scVisible = !!data.classification && data.classification !== 'unknown';
  if (scVisible && scs.length > 0) {
    for (const sc of scs) {
      // Attachment defaults: if the caller didn't specify any, assume attaches
      // to Demand — matches the old implicit semantics so existing callers
      // (seeder, import, older UI) keep working.
      const anyAttachment = sc.attachesToLifeProblem || sc.attachesToDemand || sc.attachesToWhatMatters || sc.attachesToCor || sc.attachesToWork;
      await db.insert(demandEntrySystemConditions).values({
        id: generateId(),
        demandEntryId: id,
        systemConditionId: sc.id,
        dimension: sc.dimension || 'hinders',
        attachesToLifeProblem: !!sc.attachesToLifeProblem,
        attachesToDemand:      anyAttachment ? !!sc.attachesToDemand : true,
        attachesToWhatMatters: !!sc.attachesToWhatMatters,
        attachesToCor:         !!sc.attachesToCor,
        attachesToWork:        !!sc.attachesToWork,
      });
    }
  }

  // Insert thinking junction records (mirrors system conditions visibility).
  // Each entry carries a per-pair "logic" (free-text reasoning), a per-thinking
  // helps/hinders dimension (migration 0012), and zero or more SC attachments
  // (migration 0011 — dimension later removed in 0012).
  const ths = data.thinkings || [];
  if (scVisible && ths.length > 0) {
    const scIdsOnEntry = new Set(scs.map((s) => s.id));
    for (const th of ths) {
      await db.insert(demandEntryThinkings).values({
        id: generateId(),
        demandEntryId: id,
        thinkingId: th.id,
        logic: th.logic || '',
        dimension: th.dimension === 'helps' ? 'helps' : 'hinders',
      });
      const attachments = th.scAttachments || [];
      for (const att of attachments) {
        // Defensive: only persist attachments for SCs actually on this entry.
        if (!scIdsOnEntry.has(att.systemConditionId)) continue;
        await db.insert(demandEntryThinkingScs).values({
          id: generateId(),
          demandEntryId: id,
          thinkingId: th.id,
          systemConditionId: att.systemConditionId,
        });
      }
    }
  }

  // Insert work-description blocks (Work tab only, Phase 2 / Item 4).
  if (workBlocks.length > 0) {
    let order = 0;
    for (const block of workBlocks) {
      await db.insert(workDescriptionBlocks).values({
        id: generateId(),
        demandEntryId: id,
        tag: block.tag,
        text: block.text,
        sortOrder: order++,
        workStepTypeId: block.workStepTypeId ?? null,
      });
    }
  }

  return id;
}

export async function getEntries(studyId: string, from?: Date, to?: Date) {
  const conditions = [eq(demandEntries.studyId, studyId)];
  if (from) conditions.push(gte(demandEntries.createdAt, from));
  if (to) conditions.push(lte(demandEntries.createdAt, to));

  return db.select().from(demandEntries)
    .where(and(...conditions))
    .orderBy(desc(demandEntries.createdAt));
}

export async function getFailureCauseSuggestions(studyId: string) {
  const results = await db.select({
    cause: demandEntries.failureCause,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .where(and(
      eq(demandEntries.studyId, studyId),
      eq(demandEntries.classification, 'failure'),
      sql`${demandEntries.failureCause} IS NOT NULL AND ${demandEntries.failureCause} != ''`
    ))
    .groupBy(demandEntries.failureCause)
    .orderBy(desc(sql`count(*)`))
    .limit(20);

  return results.map(r => r.cause).filter(Boolean) as string[];
}

export async function getEntryCountToday(studyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db.select({
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntries)
    .where(and(
      eq(demandEntries.studyId, studyId),
      gte(demandEntries.createdAt, today)
    ));

  return result[0]?.count || 0;
}

// --- Layer system ---

export async function activateLayer(studyId: string, targetLayer: number) {
  const study = await db.select().from(studies).where(eq(studies.id, studyId));
  if (!study[0]) throw new Error('Study not found');
  if (targetLayer !== study[0].activeLayer + 1) throw new Error('Can only activate the next layer');
  if (targetLayer > 5) throw new Error('Maximum layer is 5');
  await db.update(studies).set({ activeLayer: targetLayer }).where(eq(studies.id, studyId));
}

export async function updateEntry(entryId: string, data: {
  classification?: 'value' | 'failure' | 'unknown' | 'sequence';
  demandTypeId?: string | null;
  handlingTypeId?: string | null;
  linkedValueDemandEntryId?: string | null;
  originalValueDemandTypeId?: string | null;
  failureCause?: string | null;
  contactMethodId?: string | null;
  pointOfTransactionId?: string | null;
  workTypeId?: string | null;
  workTypeFreeText?: string | null;
  whatMatters?: string | null;
  whatMattersTypeIds?: string[];
  systemConditions?: {
    id: string;
    dimension: 'helps' | 'hinders';
    // Per Ali feedback 2026-04-16: each SC attaches to one or more of the
    // five capture fields (LP2BS, Demand, What Matters, CoR, Work).
    attachesToLifeProblem?: boolean;
    attachesToDemand?: boolean;
    attachesToWhatMatters?: boolean;
    attachesToCor?: boolean;
    attachesToWork?: boolean;
  }[];
  thinkings?: { id: string; logic: string; dimension?: 'helps' | 'hinders'; scAttachments?: { systemConditionId: string }[] }[];
  lifeProblemId?: string | null;
  // Phase 4 (2026-04-16): optional `workStepTypeId` links a block to a
  // managed Work Step Type. Null/undefined = free-text block (current behaviour).
  workBlocks?: { tag: 'value' | 'sequence' | 'failure'; text: string; workStepTypeId?: string | null }[];
}) {
  const { whatMattersTypeIds, systemConditions, thinkings, workBlocks } = data;

  // Update the entry fields
  const updateFields: Record<string, unknown> = {};
  if (data.classification !== undefined) updateFields.classification = data.classification;
  if (data.demandTypeId !== undefined) updateFields.demandTypeId = data.demandTypeId;
  if (data.handlingTypeId !== undefined) updateFields.handlingTypeId = data.handlingTypeId;
  if (data.linkedValueDemandEntryId !== undefined) updateFields.linkedValueDemandEntryId = data.linkedValueDemandEntryId;
  if (data.originalValueDemandTypeId !== undefined) updateFields.originalValueDemandTypeId = data.originalValueDemandTypeId;
  if (data.failureCause !== undefined) updateFields.failureCause = data.failureCause;
  if (data.contactMethodId !== undefined) updateFields.contactMethodId = data.contactMethodId;
  if (data.pointOfTransactionId !== undefined) updateFields.pointOfTransactionId = data.pointOfTransactionId;
  if (data.workTypeId !== undefined) updateFields.workTypeId = data.workTypeId;
  if (data.workTypeFreeText !== undefined) updateFields.workTypeFreeText = data.workTypeFreeText;
  if (data.whatMatters !== undefined) updateFields.whatMatters = data.whatMatters;
  if (data.lifeProblemId !== undefined) updateFields.lifeProblemId = data.lifeProblemId;
  // When workBlocks are sent, overwrite verbatim with the concatenation so legacy
  // verbatim consumers (search, export, dashboard list) keep working — Phase 2 / Item 4.
  if (workBlocks !== undefined && workBlocks.length > 0) {
    updateFields.verbatim = concatWorkBlocks(workBlocks);
  }

  if (Object.keys(updateFields).length > 0) {
    await db.update(demandEntries).set(updateFields).where(eq(demandEntries.id, entryId));
  }

  // Update what matters junction records if provided
  if (whatMattersTypeIds !== undefined) {
    await db.delete(demandEntryWhatMatters).where(eq(demandEntryWhatMatters.demandEntryId, entryId));
    for (const wmtId of whatMattersTypeIds) {
      await db.insert(demandEntryWhatMatters).values({
        id: generateId(),
        demandEntryId: entryId,
        whatMattersTypeId: wmtId,
      });
    }
  }

  // Update system condition junction records if provided. Carries per-pair dimension + 5 field attachments.
  if (systemConditions !== undefined) {
    await db.delete(demandEntrySystemConditions).where(eq(demandEntrySystemConditions.demandEntryId, entryId));
    for (const sc of systemConditions) {
      const anyAttachment = sc.attachesToLifeProblem || sc.attachesToDemand || sc.attachesToWhatMatters || sc.attachesToCor || sc.attachesToWork;
      await db.insert(demandEntrySystemConditions).values({
        id: generateId(),
        demandEntryId: entryId,
        systemConditionId: sc.id,
        dimension: sc.dimension || 'hinders',
        attachesToLifeProblem: !!sc.attachesToLifeProblem,
        attachesToDemand:      anyAttachment ? !!sc.attachesToDemand : true,
        attachesToWhatMatters: !!sc.attachesToWhatMatters,
        attachesToCor:         !!sc.attachesToCor,
        attachesToWork:        !!sc.attachesToWork,
      });
    }
  }

  // Update thinking junction records if provided. Carries per-pair logic, a
  // per-thinking dimension (migration 0012), and SC attachments (migration 0011).
  if (thinkings !== undefined) {
    // Clear attachments first - the junction has no cascade on this side, so
    // we need to clean explicitly before re-inserting.
    await db.delete(demandEntryThinkingScs).where(eq(demandEntryThinkingScs.demandEntryId, entryId));
    await db.delete(demandEntryThinkings).where(eq(demandEntryThinkings.demandEntryId, entryId));
    const currentScs = await db.select({ id: demandEntrySystemConditions.systemConditionId })
      .from(demandEntrySystemConditions)
      .where(eq(demandEntrySystemConditions.demandEntryId, entryId));
    const scIdsOnEntry = new Set(currentScs.map((r) => r.id));
    for (const th of thinkings) {
      await db.insert(demandEntryThinkings).values({
        id: generateId(),
        demandEntryId: entryId,
        thinkingId: th.id,
        logic: th.logic || '',
        dimension: th.dimension === 'helps' ? 'helps' : 'hinders',
      });
      const attachments = th.scAttachments || [];
      for (const att of attachments) {
        if (!scIdsOnEntry.has(att.systemConditionId)) continue;
        await db.insert(demandEntryThinkingScs).values({
          id: generateId(),
          demandEntryId: entryId,
          thinkingId: th.id,
          systemConditionId: att.systemConditionId,
        });
      }
    }
  }

  // Replace work-description blocks when provided (Work tab only, Phase 2 / Item 4).
  if (workBlocks !== undefined) {
    await db.delete(workDescriptionBlocks).where(eq(workDescriptionBlocks.demandEntryId, entryId));
    let order = 0;
    for (const block of workBlocks) {
      await db.insert(workDescriptionBlocks).values({
        id: generateId(),
        demandEntryId: entryId,
        tag: block.tag,
        text: block.text,
        sortOrder: order++,
        workStepTypeId: block.workStepTypeId ?? null,
      });
    }
  }
}

export async function getWorkBlocksForEntry(entryId: string) {
  return db.select().from(workDescriptionBlocks)
    .where(eq(workDescriptionBlocks.demandEntryId, entryId))
    .orderBy(asc(workDescriptionBlocks.sortOrder));
}

export async function getWorkBlocksForEntries(entryIds: string[]) {
  if (entryIds.length === 0) return [];
  return db.select().from(workDescriptionBlocks)
    .where(inArray(workDescriptionBlocks.demandEntryId, entryIds))
    .orderBy(asc(workDescriptionBlocks.sortOrder));
}

export async function deleteEntry(entryId: string) {
  await db.delete(demandEntryWhatMatters).where(eq(demandEntryWhatMatters.demandEntryId, entryId));
  await db.delete(demandEntryThinkingScs).where(eq(demandEntryThinkingScs.demandEntryId, entryId));
  await db.delete(demandEntrySystemConditions).where(eq(demandEntrySystemConditions.demandEntryId, entryId));
  await db.delete(demandEntryThinkings).where(eq(demandEntryThinkings.demandEntryId, entryId));
  await db.delete(workDescriptionBlocks).where(eq(workDescriptionBlocks.demandEntryId, entryId));
  await db.delete(demandEntries).where(eq(demandEntries.id, entryId));
}

export async function getEntriesForReclassification(studyId: string, layer: number) {
  const conditions = [
    eq(demandEntries.studyId, studyId),
    eq(demandEntries.entryType, 'demand'),
  ];

  if (layer === 2) {
    conditions.push(eq(demandEntries.classification, 'unknown'));
  } else if (layer === 3) {
    conditions.push(isNull(demandEntries.handlingTypeId));
  } else if (layer === 4) {
    conditions.push(eq(demandEntries.classification, 'failure'));
    conditions.push(isNull(demandEntries.linkedValueDemandEntryId));
    conditions.push(isNull(demandEntries.originalValueDemandTypeId));
  }

  return db.select().from(demandEntries)
    .where(and(...conditions))
    .orderBy(asc(demandEntries.createdAt));
}

export async function getReclassificationCount(studyId: string, layer: number): Promise<number> {
  const entries = await getEntriesForReclassification(studyId, layer);
  return entries.length;
}

export async function getWhatMattersForEntries(entryIds: string[]) {
  if (entryIds.length === 0) return [];
  return db.select().from(demandEntryWhatMatters)
    .where(inArray(demandEntryWhatMatters.demandEntryId, entryIds));
}

export async function getWhatMattersForEntry(entryId: string) {
  return db.select().from(demandEntryWhatMatters)
    .where(eq(demandEntryWhatMatters.demandEntryId, entryId));
}

// --- Lifecycle stages ---

const DEFAULT_LIFECYCLE_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    attract: 'Attract',
    acquire: 'Acquire',
    live_with: 'Live With',
    look_after: 'Look After',
    grow_keep: 'Grow / Keep',
    help_me_leave: 'Help Me Leave',
  },
  da: {
    attract: 'Tiltrække',
    acquire: 'Erhverve',
    live_with: 'Leve med',
    look_after: 'Tage sig af',
    grow_keep: 'Vokse / Beholde',
    help_me_leave: 'Hjælpe mig ud',
  },
  sv: {
    attract: 'Attrahera',
    acquire: 'Förvärva',
    live_with: 'Leva med',
    look_after: 'Ta hand om',
    grow_keep: 'Växa / Behålla',
    help_me_leave: 'Hjälp mig att lämna',
  },
  de: {
    attract: 'Anziehen',
    acquire: 'Gewinnen',
    live_with: 'Leben mit',
    look_after: 'Betreuen',
    grow_keep: 'Wachsen / Halten',
    help_me_leave: 'Hilf mir zu gehen',
  },
};

export async function getLifecycleStages(studyId: string) {
  return db.select().from(lifecycleStages).where(eq(lifecycleStages.studyId, studyId)).orderBy(asc(lifecycleStages.sortOrder));
}

export async function addLifecycleStage(studyId: string, label: string, code: string = 'custom') {
  const id = generateId();
  const existing = await getLifecycleStages(studyId);
  await db.insert(lifecycleStages).values({
    id,
    studyId,
    code,
    label,
    sortOrder: existing.length,
  });
  return id;
}

export async function updateLifecycleStage(id: string, data: { label?: string; sortOrder?: number }) {
  await db.update(lifecycleStages).set(data).where(eq(lifecycleStages.id, id));
}

export async function deleteLifecycleStage(id: string) {
  // Null out FK references first
  await db.update(demandTypes).set({ lifecycleStageId: null }).where(eq(demandTypes.lifecycleStageId, id));
  await db.update(workTypes).set({ lifecycleStageId: null }).where(eq(workTypes.lifecycleStageId, id));
  await db.update(demandEntries).set({ lifecycleStageId: null }).where(eq(demandEntries.lifecycleStageId, id));
  await db.delete(lifecycleStages).where(eq(lifecycleStages.id, id));
}

/** Idempotent: only seeds when no stages exist for this study. */
export async function seedDefaultLifecycleStages(studyId: string, locale: Locale = 'en') {
  const existing = await getLifecycleStages(studyId);
  if (existing.length > 0) return;
  const labels = DEFAULT_LIFECYCLE_LABELS[locale];
  for (let i = 0; i < STANDARD_LIFECYCLE_STAGES.length; i++) {
    const stage = STANDARD_LIFECYCLE_STAGES[i];
    await db.insert(lifecycleStages).values({
      id: generateId(),
      studyId,
      code: stage.code,
      label: labels[stage.code] || stage.label,
      sortOrder: i,
    });
  }
}

export async function setDemandTypeLifecycle(typeId: string, stageId: string | null, opts?: { aiSuggestion?: string | null }) {
  const data: Record<string, unknown> = {
    lifecycleStageId: stageId,
    lifecycleClassifiedAt: new Date(),
  };
  if (opts?.aiSuggestion !== undefined) data.lifecycleAiSuggestion = opts.aiSuggestion;
  await db.update(demandTypes).set(data).where(eq(demandTypes.id, typeId));
}

export async function setWorkTypeLifecycle(typeId: string, stageId: string | null, opts?: { aiSuggestion?: string | null }) {
  const data: Record<string, unknown> = {
    lifecycleStageId: stageId,
    lifecycleClassifiedAt: new Date(),
  };
  if (opts?.aiSuggestion !== undefined) data.lifecycleAiSuggestion = opts.aiSuggestion;
  await db.update(workTypes).set(data).where(eq(workTypes.id, typeId));
}

export async function getDemandTypeById(id: string) {
  const r = await db.select().from(demandTypes).where(eq(demandTypes.id, id));
  return r[0] || null;
}

export async function getWorkTypeById(id: string) {
  const r = await db.select().from(workTypes).where(eq(workTypes.id, id));
  return r[0] || null;
}

export async function getLifecycleStageByCode(studyId: string, code: string) {
  const r = await db.select().from(lifecycleStages).where(and(eq(lifecycleStages.studyId, studyId), eq(lifecycleStages.code, code)));
  return r[0] || null;
}

export async function getTypesMissingLifecycle(studyId: string) {
  const dts = await db.select().from(demandTypes).where(and(eq(demandTypes.studyId, studyId), isNull(demandTypes.lifecycleStageId)));
  const wts = await db.select().from(workTypes).where(and(eq(workTypes.studyId, studyId), isNull(workTypes.lifecycleStageId)));
  return { demandTypes: dts, workTypes: wts };
}

export async function setEntryLifecycleOverride(entryId: string, stageId: string | null) {
  await db.update(demandEntries).set({ lifecycleStageId: stageId }).where(eq(demandEntries.id, entryId));
}

export async function getPendingCounts(studyId: string) {
  // Needs classification: entries still marked 'unknown'
  const needsClass = await db.select({ count: sql<number>`count(*)::int` })
    .from(demandEntries)
    .where(and(eq(demandEntries.studyId, studyId), eq(demandEntries.classification, 'unknown')));

  // Needs handling: no handlingTypeId (demand entries only — handling also applies to work but often skipped)
  const needsHandling = await db.select({ count: sql<number>`count(*)::int` })
    .from(demandEntries)
    .where(and(eq(demandEntries.studyId, studyId), isNull(demandEntries.handlingTypeId)));

  // Needs value link: failure demand entries without a linked value demand entry
  const needsValueLink = await db.select({ count: sql<number>`count(*)::int` })
    .from(demandEntries)
    .where(and(
      eq(demandEntries.studyId, studyId),
      eq(demandEntries.entryType, 'demand'),
      eq(demandEntries.classification, 'failure'),
      isNull(demandEntries.linkedValueDemandEntryId),
      isNull(demandEntries.originalValueDemandTypeId),
    ));

  return {
    needsClassification: needsClass[0]?.count || 0,
    needsHandling: needsHandling[0]?.count || 0,
    needsValueLink: needsValueLink[0]?.count || 0,
  };
}

export async function searchEntries(studyId: string, options: { query?: string; typeId?: string; handlingTypeId?: string; limit?: number }) {
  const limit = options.limit || 10;
  const conditions: ReturnType<typeof eq>[] = [eq(demandEntries.studyId, studyId)];

  if (options.query) {
    conditions.push(sql`${demandEntries.verbatim} ILIKE ${'%' + options.query + '%'}` as ReturnType<typeof eq>);
  }
  if (options.typeId) {
    conditions.push(sql`(${demandEntries.demandTypeId} = ${options.typeId} OR ${demandEntries.workTypeId} = ${options.typeId})` as ReturnType<typeof eq>);
  }
  if (options.handlingTypeId) {
    conditions.push(eq(demandEntries.handlingTypeId, options.handlingTypeId));
  }

  return db.select({
    id: demandEntries.id,
    verbatim: demandEntries.verbatim,
    classification: demandEntries.classification,
    entryType: demandEntries.entryType,
    demandTypeLabel: demandTypes.label,
    workTypeLabel: workTypes.label,
  })
    .from(demandEntries)
    .leftJoin(demandTypes, eq(demandEntries.demandTypeId, demandTypes.id))
    .leftJoin(workTypes, eq(demandEntries.workTypeId, workTypes.id))
    .where(and(...conditions))
    .orderBy(desc(demandEntries.createdAt))
    .limit(limit);
}
