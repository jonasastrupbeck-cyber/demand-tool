import { db } from './db';
import { studies, handlingTypes, demandTypes, contactMethods, whatMattersTypes, demandEntries } from './schema';
import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import { generateId, generateAccessCode } from './utils';
import { initializeDatabase } from './init-db';
import type { Locale } from './i18n';

// Ensure tables exist
initializeDatabase();

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

export async function createStudy(name: string, description: string = '', locale: Locale = 'en') {
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
  for (let i = 0; i < localizedContactMethods.length; i++) {
    await db.insert(contactMethods).values({
      id: generateId(),
      studyId: id,
      label: localizedContactMethods[i],
      sortOrder: i,
    });
  }

  return { id, accessCode };
}

export async function getStudyByCode(code: string) {
  const result = await db.select().from(studies).where(eq(studies.accessCode, code.toUpperCase()));
  return result[0] || null;
}

export async function updateStudy(id: string, data: { name?: string; description?: string; oneStopHandlingType?: string | null }) {
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

export async function deleteWhatMattersType(id: string) {
  await db.delete(whatMattersTypes).where(eq(whatMattersTypes.id, id));
}

export async function createEntry(studyId: string, data: {
  verbatim: string;
  classification: 'value' | 'failure';
  handlingTypeId?: string;
  demandTypeId?: string;
  contactMethodId?: string;
  whatMattersTypeId?: string;
  failureCause?: string;
  whatMatters?: string;
}, createdAt?: Date) {
  const id = generateId();
  await db.insert(demandEntries).values({
    id,
    studyId,
    createdAt: createdAt || new Date(),
    verbatim: data.verbatim,
    classification: data.classification,
    handlingTypeId: data.handlingTypeId || null,
    demandTypeId: data.demandTypeId || null,
    contactMethodId: data.contactMethodId || null,
    whatMattersTypeId: data.whatMattersTypeId || null,
    failureCause: data.classification === 'failure' ? (data.failureCause || null) : null,
    whatMatters: data.whatMatters || null,
  });
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
    count: sql<number>`count(*)`,
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
    count: sql<number>`count(*)`,
  })
    .from(demandEntries)
    .where(and(
      eq(demandEntries.studyId, studyId),
      gte(demandEntries.createdAt, today)
    ));

  return result[0]?.count || 0;
}
