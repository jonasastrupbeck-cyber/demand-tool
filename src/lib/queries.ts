import { db } from './db';
import { studies, handlingTypes, demandTypes, contactMethods, pointsOfTransaction, whatMattersTypes, workTypes, demandEntries, demandEntryWhatMatters, systemConditions, demandEntrySystemConditions, thinkings, demandEntryThinkings, lifecycleStages } from './schema';
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
  await db.insert(handlingTypes).values({
    id,
    studyId,
    label,
    sortOrder: existing.length,
  });
  return id;
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
  await db.insert(demandTypes).values({
    id,
    studyId,
    category,
    label,
    sortOrder: existing.length,
  });
  return id;
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

export async function deleteContactMethod(id: string) {
  await db.delete(contactMethods).where(eq(contactMethods.id, id));
}

export async function getWhatMattersTypes(studyId: string) {
  return db.select().from(whatMattersTypes).where(eq(whatMattersTypes.studyId, studyId)).orderBy(asc(whatMattersTypes.sortOrder));
}

export async function addWhatMattersType(studyId: string, label: string) {
  const id = generateId();
  const existing = await getWhatMattersTypes(studyId);
  await db.insert(whatMattersTypes).values({
    id,
    studyId,
    label,
    sortOrder: existing.length,
  });
  return id;
}

export async function updateWhatMattersType(id: string, data: { label?: string; operationalDefinition?: string | null }) {
  await db.update(whatMattersTypes).set(data).where(eq(whatMattersTypes.id, id));
}

export async function deleteWhatMattersType(id: string) {
  await db.delete(whatMattersTypes).where(eq(whatMattersTypes.id, id));
}

// --- System Conditions ---

export async function getSystemConditions(studyId: string) {
  return db.select().from(systemConditions).where(eq(systemConditions.studyId, studyId)).orderBy(asc(systemConditions.sortOrder));
}

export async function addSystemCondition(studyId: string, label: string) {
  const id = generateId();
  const existing = await getSystemConditions(studyId);
  await db.insert(systemConditions).values({
    id,
    studyId,
    label,
    sortOrder: existing.length,
  });
  return id;
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
  await db.insert(thinkings).values({
    id,
    studyId,
    label,
    sortOrder: existing.length,
  });
  return id;
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

export async function getWorkTypes(studyId: string) {
  return db.select().from(workTypes).where(eq(workTypes.studyId, studyId)).orderBy(asc(workTypes.sortOrder));
}

export async function addWorkType(studyId: string, label: string) {
  const id = generateId();
  const existing = await getWorkTypes(studyId);
  await db.insert(workTypes).values({
    id,
    studyId,
    label,
    sortOrder: existing.length,
  });
  return id;
}

export async function deleteWorkType(id: string) {
  await db.delete(workTypes).where(eq(workTypes.id, id));
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
      sortOrder: i,
    });
  }
}

export async function createEntry(studyId: string, data: {
  verbatim: string;
  classification: 'value' | 'failure' | 'unknown' | 'sequence';
  entryType?: 'demand' | 'work';
  handlingTypeId?: string;
  demandTypeId?: string;
  contactMethodId?: string;
  pointOfTransactionId?: string;
  whatMattersTypeId?: string;
  whatMattersTypeIds?: string[];
  systemConditionIds?: string[];
  thinkingIds?: string[];
  originalValueDemandTypeId?: string;
  workTypeId?: string;
  linkedValueDemandEntryId?: string;
  failureCause?: string;
  whatMatters?: string;
  collectorName?: string;
}, createdAt?: Date) {
  const id = generateId();
  const entryType = data.entryType || 'demand';
  const isDemand = entryType === 'demand';
  await db.insert(demandEntries).values({
    id,
    studyId,
    createdAt: createdAt || new Date(),
    verbatim: data.verbatim,
    classification: data.classification,
    entryType,
    handlingTypeId: data.handlingTypeId || null,
    demandTypeId: isDemand ? (data.demandTypeId || null) : null,
    contactMethodId: data.contactMethodId || null,
    pointOfTransactionId: data.pointOfTransactionId || null,
    whatMattersTypeId: isDemand ? (data.whatMattersTypeId || null) : null,
    originalValueDemandTypeId: isDemand && data.classification === 'failure' ? (data.originalValueDemandTypeId || null) : null,
    workTypeId: !isDemand ? (data.workTypeId || null) : null,
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

  // Insert system condition junction records
  const scIds = data.systemConditionIds || [];
  const scVisible = data.classification === 'failure' || data.classification === 'sequence';
  if (scVisible && scIds.length > 0) {
    for (const scId of scIds) {
      await db.insert(demandEntrySystemConditions).values({
        id: generateId(),
        demandEntryId: id,
        systemConditionId: scId,
      });
    }
  }

  // Insert thinking junction records (mirrors system conditions visibility)
  const thIds = data.thinkingIds || [];
  if (scVisible && thIds.length > 0) {
    for (const thId of thIds) {
      await db.insert(demandEntryThinkings).values({
        id: generateId(),
        demandEntryId: id,
        thinkingId: thId,
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
  whatMatters?: string | null;
  whatMattersTypeIds?: string[];
  systemConditionIds?: string[];
  thinkingIds?: string[];
}) {
  const { whatMattersTypeIds, systemConditionIds, thinkingIds, ...entryData } = data;

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
  if (data.whatMatters !== undefined) updateFields.whatMatters = data.whatMatters;

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

  // Update system condition junction records if provided
  if (systemConditionIds !== undefined) {
    await db.delete(demandEntrySystemConditions).where(eq(demandEntrySystemConditions.demandEntryId, entryId));
    for (const scId of systemConditionIds) {
      await db.insert(demandEntrySystemConditions).values({
        id: generateId(),
        demandEntryId: entryId,
        systemConditionId: scId,
      });
    }
  }

  // Update thinking junction records if provided
  if (thinkingIds !== undefined) {
    await db.delete(demandEntryThinkings).where(eq(demandEntryThinkings.demandEntryId, entryId));
    for (const thId of thinkingIds) {
      await db.insert(demandEntryThinkings).values({
        id: generateId(),
        demandEntryId: entryId,
        thinkingId: thId,
      });
    }
  }
}

export async function deleteEntry(entryId: string) {
  await db.delete(demandEntryWhatMatters).where(eq(demandEntryWhatMatters.demandEntryId, entryId));
  await db.delete(demandEntrySystemConditions).where(eq(demandEntrySystemConditions.demandEntryId, entryId));
  await db.delete(demandEntryThinkings).where(eq(demandEntryThinkings.demandEntryId, entryId));
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

export async function searchEntries(studyId: string, options: { query?: string; typeId?: string; limit?: number }) {
  const limit = options.limit || 10;
  const conditions: ReturnType<typeof eq>[] = [eq(demandEntries.studyId, studyId)];

  if (options.query) {
    conditions.push(sql`${demandEntries.verbatim} ILIKE ${'%' + options.query + '%'}` as ReturnType<typeof eq>);
  }
  if (options.typeId) {
    conditions.push(sql`(${demandEntries.demandTypeId} = ${options.typeId} OR ${demandEntries.workTypeId} = ${options.typeId})` as ReturnType<typeof eq>);
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
