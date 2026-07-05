import { db } from './db';
import { studies, handlingTypes, demandTypes, contactMethods, pointsOfTransaction, workSources, whatMattersTypes, workTypes, workStepTypes, valueSteps, demandEntries, demandEntryWhatMatters, systemConditions, demandEntrySystemConditions, workBlockSystemConditions, systemConditionMerges, taxonomyMerges, thinkings, demandEntryThinkings, demandEntryThinkingScs, lifecycleStages, lifeProblems, workDescriptionBlocks, cases, caseWhatMatters, caseLifeProblems, caseDemandTypes, milestones, caseMilestones, milestoneDemandTypeExclusions, subquestions, subquestionOptions, subquestionConditions, subquestionDemandTypeExclusions, subquestionDemandTypeOptional, caseSubquestionAnswers, capabilityAnnotations } from './schema';
import { visibleSubquestionIds } from './subquestion-visibility';
import { eq, and, or, desc, asc, sql, gt, gte, lte, isNull, inArray } from 'drizzle-orm';
import { generateId, generateAccessCode } from './utils';
import { kindsCompatible, compatibleKinds } from './subquestion-kinds';
import type { Locale } from './i18n';
import { STANDARD_LIFECYCLE_STAGES } from './ai/classify-lifecycle';

// Ownership guard for the taxonomy [id] routes. Rows are addressed by id, and
// ids are exposed in study payloads/exports, so a bare `WHERE id = ?` mutation
// lets any study-code holder touch another study's rows. Each [id] route calls
// this before mutating/deleting so a foreign id returns 404 instead.
const OWNED_TABLES = {
  contactMethods, demandTypes, handlingTypes, lifeProblems, lifecycleStages,
  pointsOfTransaction, systemConditions, thinkings, valueSteps, whatMattersTypes,
  workSources, workStepTypes, workTypes,
} as const;
export async function rowBelongsToStudy(table: keyof typeof OWNED_TABLES, id: string, studyId: string): Promise<boolean> {
  const t = OWNED_TABLES[table];
  const rows = await db.select({ id: t.id }).from(t).where(and(eq(t.id, id), eq(t.studyId, studyId))).limit(1);
  return rows.length > 0;
}

// Validate that referenced taxonomy ids in a write body all belong to this
// study. Prevents cross-study reference injection (a foreign id would render as
// a blank label, drop out of study-scoped aggregations, or FK-500 mid-write).
// One batched query per present entity type; returns an error string or null.
export async function validateStudyRefs(
  studyId: string,
  refs: Partial<Record<keyof typeof OWNED_TABLES, (string | null | undefined)[]>>,
): Promise<string | null> {
  const checks: Promise<string | null>[] = [];
  for (const key of Object.keys(refs) as (keyof typeof OWNED_TABLES)[]) {
    const ids = [...new Set((refs[key] ?? []).filter((x): x is string => typeof x === 'string' && x.length > 0))];
    if (ids.length === 0) continue;
    const t = OWNED_TABLES[key];
    checks.push(
      db.select({ id: t.id }).from(t).where(and(inArray(t.id, ids), eq(t.studyId, studyId)))
        .then((rows) => (rows.length === ids.length ? null : `Invalid ${key} reference for this study`)),
    );
  }
  const results = await Promise.all(checks);
  return results.find((r) => r !== null) ?? null;
}

// Collect every taxonomy id referenced by an entry write body (top-level + per
// work block) into the shape validateStudyRefs expects. Shared by POST + PATCH.
export function collectEntryRefs(body: Record<string, unknown>): Partial<Record<keyof typeof OWNED_TABLES, (string | null | undefined)[]>> {
  const blocks = Array.isArray(body.workBlocks) ? (body.workBlocks as Array<Record<string, unknown>>) : [];
  const scs = Array.isArray(body.systemConditions) ? (body.systemConditions as Array<Record<string, unknown>>) : [];
  const ths = Array.isArray(body.thinkings) ? (body.thinkings as Array<Record<string, unknown>>) : [];
  const blockScIds = blocks.flatMap((b) => [
    b.systemConditionId as string | undefined,
    ...(Array.isArray(b.systemConditionIds) ? (b.systemConditionIds as string[]) : []),
  ]);
  const thScIds = ths.flatMap((t) => (Array.isArray(t.scAttachments)
    ? (t.scAttachments as Array<Record<string, unknown>>).map((a) => a.systemConditionId as string | undefined)
    : []));
  return {
    demandTypes: [body.demandTypeId as string, body.originalValueDemandTypeId as string, ...blocks.map((b) => b.demandTypeId as string | undefined)],
    handlingTypes: [body.handlingTypeId as string],
    contactMethods: [body.contactMethodId as string],
    pointsOfTransaction: [body.pointOfTransactionId as string],
    workSources: [body.workSourceId as string],
    workTypes: [body.workTypeId as string],
    lifeProblems: [body.lifeProblemId as string],
    whatMattersTypes: [body.whatMattersTypeId as string, ...(Array.isArray(body.whatMattersTypeIds) ? (body.whatMattersTypeIds as string[]) : [])],
    systemConditions: [...scs.map((s) => s.id as string | undefined), ...blockScIds, ...thScIds],
    thinkings: ths.map((t) => t.id as string | undefined),
    workStepTypes: blocks.map((b) => b.workStepTypeId as string | undefined),
    valueSteps: blocks.map((b) => b.valueStepId as string | undefined),
  };
}

// Which of the given work-block ids belong to this study (block → entry → study).
// Used to stop the work-step promote endpoint reassigning another study's blocks.
export async function filterBlockIdsInStudy(studyId: string, blockIds: string[]): Promise<string[]> {
  if (blockIds.length === 0) return [];
  const rows = await db.select({ id: workDescriptionBlocks.id })
    .from(workDescriptionBlocks)
    .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
    .where(and(inArray(workDescriptionBlocks.id, blockIds), eq(demandEntries.studyId, studyId)));
  return rows.map((r) => r.id);
}

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

// R9 (2026-06-18): flow studies seed a different set of capability-of-response
// types — the four CORs Jonas authored on study V5YKDS (Help Me Stay), written
// in the customer's voice. The first is the one-stop default. English-only
// starter labels for all locales (a consultant renames per study). label +
// operationalDefinition.
const FLOW_COR_DEFAULTS: { label: string; operationalDefinition: string }[] = [
  { label: 'Done and Dusted', operationalDefinition: 'Nothing more for me to do or Skipton' },
  { label: 'I was handed off', operationalDefinition: 'was passed to a different team' },
  { label: 'I want to reflect', operationalDefinition: 'I want time to think' },
  { label: 'Hand-Off', operationalDefinition: 'Work is passed outside of Help Me Stay (This is one that the customer wouldn\'t feel *)' },
];

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

// Decision points (Skipton dotted box, 2026-06-12). Seeded for flow studies;
// labels are DB data per locale, fully editable in settings afterwards.
// EN verbatim from the Skipton requirements note.
const DEFAULT_DECISION_POINT_TYPES: Record<Locale, { label: string; positiveLabel: string; negativeLabel: string; kind?: string }[]> = {
  en: [
    { label: 'Decision on the person', positiveLabel: 'Accept', negativeLabel: 'Decline', kind: 'person' },
    { label: 'Decision on the property', positiveLabel: 'Accept', negativeLabel: 'Decline' },
    { label: 'Decision on the value', positiveLabel: '\u00a3 accepted', negativeLabel: '\u00a3 disputed' },
  ],
  da: [
    { label: 'Beslutning om personen', positiveLabel: 'Godkendt', negativeLabel: 'Afvist', kind: 'person' },
    { label: 'Beslutning om ejendommen', positiveLabel: 'Godkendt', negativeLabel: 'Afvist' },
    { label: 'Beslutning om v\u00e6rdien', positiveLabel: 'V\u00e6rdi godkendt', negativeLabel: 'V\u00e6rdi bestridt' },
  ],
  sv: [
    { label: 'Beslut om personen', positiveLabel: 'Godk\u00e4nd', negativeLabel: 'Avslagen', kind: 'person' },
    { label: 'Beslut om fastigheten', positiveLabel: 'Godk\u00e4nd', negativeLabel: 'Avslagen' },
    { label: 'Beslut om v\u00e4rdet', positiveLabel: 'V\u00e4rde godk\u00e4nt', negativeLabel: 'V\u00e4rde bestritt' },
  ],
  de: [
    { label: 'Entscheidung zur Person', positiveLabel: 'Angenommen', negativeLabel: 'Abgelehnt', kind: 'person' },
    { label: 'Entscheidung zur Immobilie', positiveLabel: 'Angenommen', negativeLabel: 'Abgelehnt' },
    { label: 'Entscheidung zum Wert', positiveLabel: 'Wert akzeptiert', negativeLabel: 'Wert strittig' },
  ],
};

// Default milestone wrapping the seeded decision points on a fresh study
// (2026-06-18). Plain domain wording (not a Vanguard concept); consultants rename.
const DEFAULT_MILESTONE_LABEL: Record<Locale, string> = {
  en: 'Milestone 1',
  da: 'Milepæl 1',
  sv: 'Milstolpe 1',
  de: 'Meilenstein 1',
};

const DEFAULT_WORK_TYPES: Record<Locale, string[]> = {
  en: ['Information request (internal)', 'Management reporting', 'Internal process query'],
  da: ['Informationsforespørgsel (intern)', 'Ledelsesrapportering', 'Intern procesforespørgsel'],
  sv: ['Informationsförfrågan (intern)', 'Ledningsrapportering', 'Intern processförfrågan'],
  de: ['Informationsanfrage (intern)', 'Management-Berichterstattung', 'Interne Prozessanfrage'],
};

// Flow preset (2026-06-11): the strand toggles a flow-based study starts with.
// Applied ADDITIVELY only — choosing or switching to 'flow' turns these on,
// never turns anything off (hiding captured data is the documented anti-pattern).
export const FLOW_PRESET_TOGGLES = {
  caseTrackingEnabled: true,
  classificationEnabled: true,
  demandTypesEnabled: true,
  handlingEnabled: true,
  lifeProblemsEnabled: true,
  whatMattersEnabled: true,
  workTrackingEnabled: true,
  // The SC question on failure/sequence actions is integral to flow capture.
  systemConditionsEnabled: true,
  // The dotted box (decision points) is part of the flow regime.
  decisionPointsEnabled: true,
  // flowWorkEnabled deliberately NOT in the preset (2026-06-12): in flow mode
  // each action is one step — the case timeline is the flow — so per-entry
  // flow blocks are hidden by the flowMode render gate regardless.
} as const;

export async function createStudy(name: string, description: string = '', locale: Locale = 'en', primaryContactMethod?: string, pointOfTransaction?: string, workTrackingEnabled: boolean = false, consultantPin?: string, systemType: 'transactional' | 'flow' = 'transactional') {
  const id = generateId();
  let accessCode = generateAccessCode();

  // Check for collision
  const existing = await db.select().from(studies).where(eq(studies.accessCode, accessCode));
  if (existing.length > 0) {
    accessCode = generateAccessCode();
  }

  const isFlow = systemType === 'flow';
  await db.insert(studies).values({
    id,
    accessCode,
    name,
    description,
    workTrackingEnabled: workTrackingEnabled || isFlow,
    activeLayer: 1,
    consultantPin: consultantPin || null,
    createdAt: new Date(),
    isActive: true,
    systemType,
    // Flow studies start with the case-first strands on (preset, still
    // individually tunable afterwards in the toggles panel).
    ...(isFlow ? FLOW_PRESET_TOGGLES : {}),
  });

  // Create default handling types (capability of response). Flow studies seed
  // the four flow CORs (with operational definitions); transactional studies
  // seed the localized One Stop / Pass-on / Pass-back defaults.
  const handlingSeed = isFlow
    ? FLOW_COR_DEFAULTS
    : DEFAULT_HANDLING_TYPES[locale].map((label) => ({ label, operationalDefinition: undefined as string | undefined }));
  const handlingTypeIds: string[] = [];
  for (let i = 0; i < handlingSeed.length; i++) {
    const htId = generateId();
    handlingTypeIds.push(htId);
    await db.insert(handlingTypes).values({
      id: htId,
      studyId: id,
      label: handlingSeed[i].label,
      operationalDefinition: handlingSeed[i].operationalDefinition ?? null,
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

  // Create default work types if work tracking is enabled (the flow preset
  // turns work tracking on too).
  if (workTrackingEnabled || isFlow) {
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

  // Flow studies start with a milestone of seeded subquestions (the flattened
  // decision box) and the two standard time-based what-matters types.
  if (isFlow) {
    await seedDefaultSubquestions(id, locale);
    await ensureStandardWhatMattersTypes(id);
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

export async function updateHandlingType(id: string, data: { label?: string; operationalDefinition?: string | null; customerFacing?: boolean }) {
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
    enabled: true,
    valueKind: null as 'amount' | 'date_or_duration' | null,
  };
  await db.insert(whatMattersTypes).values(row);
  return row;
}

export async function updateWhatMattersType(id: string, data: { label?: string; operationalDefinition?: string | null; anchorMilestoneId?: string | null; anchorEvent?: string | null; enabled?: boolean; valueKind?: 'amount' | 'date_or_duration' | null }) {
  await db.update(whatMattersTypes).set(data).where(eq(whatMattersTypes.id, id));
}

export async function deleteWhatMattersType(id: string) {
  // The two standard timed types ("When I want it" / "As soon as possible") are
  // protected — they carry a `timing` value and must not be deleted.
  const [row] = await db.select().from(whatMattersTypes).where(eq(whatMattersTypes.id, id));
  if (!row) return;
  if (row.timing) throw new Error('PROTECTED_STANDARD_TYPE');
  // The junction FKs are RESTRICT, so a bare delete fails once the type has been
  // selected on a case or entry. Cascade the selections first (the pill is going
  // away, so its selections go with it), then delete the type.
  await db.delete(caseWhatMatters).where(eq(caseWhatMatters.whatMattersTypeId, id));
  await db.delete(demandEntryWhatMatters).where(eq(demandEntryWhatMatters.whatMattersTypeId, id));
  await db.update(demandEntries).set({ whatMattersTypeId: null }).where(eq(demandEntries.whatMattersTypeId, id));
  await db.delete(whatMattersTypes).where(eq(whatMattersTypes.id, id));
}

// Two standard time-based what-matters types for flow studies (2026-07-01),
// seeded alongside any free-form factors. 'by_date' captures a target date per
// case (case_what_matters.target_date); 'asap' measures from case open.
export const STANDARD_TIMED_WHAT_MATTERS: { label: string; timing: 'by_date' | 'asap' }[] = [
  { label: 'When I want it', timing: 'by_date' },
  { label: 'As soon as possible', timing: 'asap' },
];

// Idempotent: add either standard timed type only if a same-`timing` row is
// absent. Safe to re-run (used both at flow-study creation and to backfill
// existing flow studies).
export async function ensureStandardWhatMattersTypes(studyId: string) {
  const existing = await db.select().from(whatMattersTypes).where(eq(whatMattersTypes.studyId, studyId));
  let nextSort = existing.length;
  for (const std of STANDARD_TIMED_WHAT_MATTERS) {
    if (existing.some((w) => w.timing === std.timing)) continue;
    await db.insert(whatMattersTypes).values({
      id: generateId(),
      studyId,
      label: std.label,
      operationalDefinition: null,
      sortOrder: nextSort++,
      timing: std.timing,
    });
  }
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

export async function getSystemConditions(studyId: string, opts?: { includeArchived?: boolean }) {
  // Synthesis (0028): archived conditions are merged-away duplicates. Hidden by
  // default so they vanish from capture pickers, the study payload, and charts.
  // The synthesis surface passes includeArchived to show them in the merge log.
  const conds = [eq(systemConditions.studyId, studyId)];
  if (!opts?.includeArchived) conds.push(isNull(systemConditions.archivedAt));
  return db.select().from(systemConditions).where(and(...conds)).orderBy(asc(systemConditions.sortOrder));
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

// --- System-condition synthesis: merge-in-place + undo (migration 0028) ---
//
// The team studies the captured-condition distribution and finds categories
// that are really the same thing (Same/Similar/Different). mergeSystemConditions
// re-points EVERY linked record from the sources to one surviving condition,
// then soft-archives the sources. Three linked-record types are re-pointed:
//   1. demand_entry_system_conditions   (dedupe key: entry + sc)
//   2. demand_entry_thinking_scs         (dedupe key: entry + thinking + sc)
//   3. work_description_blocks           (one sc per block, no dedupe)
// Each move is recorded so undoSystemConditionMerge can replay it in reverse.
// neon-http has no interactive transactions, so ops run sequentially (matching
// createEntry/updateEntry); the audit row is written last.

type EntryScRow = typeof demandEntrySystemConditions.$inferSelect;
type ThinkingScRow = typeof demandEntryThinkingScs.$inferSelect;
type WorkBlockScRow = typeof workBlockSystemConditions.$inferSelect;
type MovedJunction =
  | { a: 'repoint'; id: string; from: string }
  | { a: 'restore'; row: EntryScRow };
type MovedThinkingSc =
  | { a: 'repoint'; id: string; from: string }
  | { a: 'restore'; row: ThinkingScRow };
type MovedBlockSc =
  | { a: 'repoint'; id: string; from: string }
  | { a: 'restore'; row: WorkBlockScRow };
type MovedBlock = { id: string; from: string }; // legacy (pre-0032) audit shape

// Every link-row id a SC merge touched (re-pointed or deleted-then-restored).
// Used to detect overlap with later merges so undo stays reverse-ordered.
function scMergeRowIds(j: MovedJunction[], t: MovedThinkingSc[], blockScs: MovedBlockSc[], legacyBlocks: MovedBlock[]): string[] {
  const ids: string[] = [];
  for (const mv of j) ids.push(mv.a === 'repoint' ? mv.id : mv.row.id);
  for (const mv of t) ids.push(mv.a === 'repoint' ? mv.id : mv.row.id);
  for (const mv of blockScs) ids.push(mv.a === 'repoint' ? mv.id : mv.row.id);
  for (const mv of legacyBlocks) ids.push(mv.id);
  return ids;
}

export async function mergeSystemConditions(
  studyId: string,
  { targetId, sourceIds, newLabel }: { targetId: string; sourceIds: string[]; newLabel?: string },
) {
  const uniqueSources = [...new Set(sourceIds)].filter((id) => id !== targetId);
  if (uniqueSources.length === 0) throw new Error('No source conditions to merge');

  // Validate: every id belongs to this study and none is already archived.
  const all = await db.select().from(systemConditions).where(and(
    eq(systemConditions.studyId, studyId),
    inArray(systemConditions.id, [targetId, ...uniqueSources]),
  ));
  const byId = new Map(all.map((c) => [c.id, c]));
  const target = byId.get(targetId);
  if (!target) throw new Error('Target system condition not found in study');
  if (target.archivedAt) throw new Error('Target system condition is archived');
  for (const sid of uniqueSources) {
    const s = byId.get(sid);
    if (!s) throw new Error('Source system condition not found in study');
    if (s.archivedAt) throw new Error('Source system condition already archived');
  }

  const sourceSet = new Set(uniqueSources);
  const movedJunctions: MovedJunction[] = [];
  const movedThinkingScs: MovedThinkingSc[] = [];
  const movedBlocks: MovedBlock[] = []; // legacy column; new merges record block moves in movedBlockScs
  const movedBlockScs: MovedBlockSc[] = [];

  // 1) demand_entry_system_conditions — group per entry; if the entry already
  // links the target, the source rows are duplicates (delete + record for undo);
  // otherwise re-point the first source row and drop any further duplicates.
  {
    const rows = await db.select({ j: demandEntrySystemConditions })
      .from(demandEntrySystemConditions)
      .innerJoin(demandEntries, eq(demandEntrySystemConditions.demandEntryId, demandEntries.id))
      .where(and(
        eq(demandEntries.studyId, studyId),
        inArray(demandEntrySystemConditions.systemConditionId, [targetId, ...uniqueSources]),
      ));
    const groups = new Map<string, EntryScRow[]>();
    for (const { j } of rows) {
      const g = groups.get(j.demandEntryId);
      if (g) g.push(j); else groups.set(j.demandEntryId, [j]);
    }
    for (const group of groups.values()) {
      const hasTarget = group.some((r) => r.systemConditionId === targetId);
      const srcRows = group.filter((r) => sourceSet.has(r.systemConditionId));
      if (srcRows.length === 0) continue;
      if (hasTarget) {
        for (const r of srcRows) {
          await db.delete(demandEntrySystemConditions).where(eq(demandEntrySystemConditions.id, r.id));
          movedJunctions.push({ a: 'restore', row: r });
        }
      } else {
        const [keep, ...rest] = srcRows;
        movedJunctions.push({ a: 'repoint', id: keep.id, from: keep.systemConditionId });
        await db.update(demandEntrySystemConditions).set({ systemConditionId: targetId }).where(eq(demandEntrySystemConditions.id, keep.id));
        for (const r of rest) {
          await db.delete(demandEntrySystemConditions).where(eq(demandEntrySystemConditions.id, r.id));
          movedJunctions.push({ a: 'restore', row: r });
        }
      }
    }
  }

  // 2) demand_entry_thinking_scs — same shape, dedupe key is (entry, thinking, sc).
  {
    const rows = await db.select({ j: demandEntryThinkingScs })
      .from(demandEntryThinkingScs)
      .innerJoin(demandEntries, eq(demandEntryThinkingScs.demandEntryId, demandEntries.id))
      .where(and(
        eq(demandEntries.studyId, studyId),
        inArray(demandEntryThinkingScs.systemConditionId, [targetId, ...uniqueSources]),
      ));
    const groups = new Map<string, ThinkingScRow[]>();
    for (const { j } of rows) {
      const key = `${j.demandEntryId}::${j.thinkingId}`;
      const g = groups.get(key);
      if (g) g.push(j); else groups.set(key, [j]);
    }
    for (const group of groups.values()) {
      const hasTarget = group.some((r) => r.systemConditionId === targetId);
      const srcRows = group.filter((r) => sourceSet.has(r.systemConditionId));
      if (srcRows.length === 0) continue;
      if (hasTarget) {
        for (const r of srcRows) {
          await db.delete(demandEntryThinkingScs).where(eq(demandEntryThinkingScs.id, r.id));
          movedThinkingScs.push({ a: 'restore', row: r });
        }
      } else {
        const [keep, ...rest] = srcRows;
        movedThinkingScs.push({ a: 'repoint', id: keep.id, from: keep.systemConditionId });
        await db.update(demandEntryThinkingScs).set({ systemConditionId: targetId }).where(eq(demandEntryThinkingScs.id, keep.id));
        for (const r of rest) {
          await db.delete(demandEntryThinkingScs).where(eq(demandEntryThinkingScs.id, r.id));
          movedThinkingScs.push({ a: 'restore', row: r });
        }
      }
    }
  }

  // 3) work_block_system_conditions junction (0032) — same dedupe as the entry-SC
  // junction, grouped per block: if the block already links the target, source
  // rows are duplicates (delete + record); else re-point the first and drop the rest.
  {
    const rows = await db.select({ j: workBlockSystemConditions })
      .from(workBlockSystemConditions)
      .innerJoin(workDescriptionBlocks, eq(workBlockSystemConditions.workBlockId, workDescriptionBlocks.id))
      .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
      .where(and(
        eq(demandEntries.studyId, studyId),
        inArray(workBlockSystemConditions.systemConditionId, [targetId, ...uniqueSources]),
      ));
    const groups = new Map<string, WorkBlockScRow[]>();
    for (const { j } of rows) {
      const g = groups.get(j.workBlockId);
      if (g) g.push(j); else groups.set(j.workBlockId, [j]);
    }
    for (const group of groups.values()) {
      const hasTarget = group.some((r) => r.systemConditionId === targetId);
      const srcRows = group.filter((r) => sourceSet.has(r.systemConditionId));
      if (srcRows.length === 0) continue;
      if (hasTarget) {
        for (const r of srcRows) {
          await db.delete(workBlockSystemConditions).where(eq(workBlockSystemConditions.id, r.id));
          movedBlockScs.push({ a: 'restore', row: r });
        }
      } else {
        const [keep, ...rest] = srcRows;
        movedBlockScs.push({ a: 'repoint', id: keep.id, from: keep.systemConditionId });
        await db.update(workBlockSystemConditions).set({ systemConditionId: targetId }).where(eq(workBlockSystemConditions.id, keep.id));
        for (const r of rest) {
          await db.delete(workBlockSystemConditions).where(eq(workBlockSystemConditions.id, r.id));
          movedBlockScs.push({ a: 'restore', row: r });
        }
      }
    }
  }

  // 4) optional rename of the surviving condition to the agreed common name.
  let priorTargetLabel: string | null = null;
  const trimmed = newLabel?.trim();
  if (trimmed && trimmed !== target.label) {
    priorTargetLabel = target.label;
    await db.update(systemConditions).set({ label: trimmed }).where(eq(systemConditions.id, targetId));
  }

  // 5) soft-archive the sources.
  const archivedAt = new Date();
  await db.update(systemConditions)
    .set({ archivedAt, mergedIntoId: targetId })
    .where(inArray(systemConditions.id, uniqueSources));

  // 6) audit row (written last so a partial failure leaves no phantom undo).
  const mergeId = generateId();
  await db.insert(systemConditionMerges).values({
    id: mergeId,
    studyId,
    targetId,
    sourceIds: JSON.stringify(uniqueSources),
    movedJunctionIds: JSON.stringify(movedJunctions),
    movedBlockIds: JSON.stringify(movedBlocks),
    movedThinkingScs: JSON.stringify(movedThinkingScs),
    movedBlockScs: JSON.stringify(movedBlockScs),
    priorTargetLabel,
    createdAt: archivedAt,
  });

  return { mergeId, archivedCount: uniqueSources.length };
}

export async function undoSystemConditionMerge(studyId: string, mergeId: string) {
  const [m] = await db.select().from(systemConditionMerges).where(and(
    eq(systemConditionMerges.id, mergeId),
    eq(systemConditionMerges.studyId, studyId),
  ));
  if (!m) throw new Error('Merge record not found');

  const sourceIds: string[] = JSON.parse(m.sourceIds);
  const movedJunctions: MovedJunction[] = JSON.parse(m.movedJunctionIds);
  const movedThinkingScs: MovedThinkingSc[] = JSON.parse(m.movedThinkingScs);
  const movedBlocks: MovedBlock[] = JSON.parse(m.movedBlockIds); // legacy (pre-0032 records)
  const movedBlockScs: MovedBlockSc[] = JSON.parse(m.movedBlockScs);

  // Chained-merge safety: if a LATER merge re-pointed any of the same rows, undoing
  // this one first would corrupt the later merge. Require reverse-order undo.
  const myRowIds = new Set(scMergeRowIds(movedJunctions, movedThinkingScs, movedBlockScs, movedBlocks));
  const later = await db.select({ mj: systemConditionMerges.movedJunctionIds, mt: systemConditionMerges.movedThinkingScs, mb: systemConditionMerges.movedBlockIds, mbs: systemConditionMerges.movedBlockScs })
    .from(systemConditionMerges)
    .where(and(eq(systemConditionMerges.studyId, studyId), gt(systemConditionMerges.createdAt, m.createdAt)));
  for (const l of later) {
    const ids = scMergeRowIds(JSON.parse(l.mj), JSON.parse(l.mt), JSON.parse(l.mbs), JSON.parse(l.mb));
    if (ids.some((id) => myRowIds.has(id))) throw new Error('Undo more recent merges first.');
  }

  for (const mv of movedJunctions) {
    if (mv.a === 'repoint') {
      await db.update(demandEntrySystemConditions).set({ systemConditionId: mv.from }).where(eq(demandEntrySystemConditions.id, mv.id));
    } else {
      await db.insert(demandEntrySystemConditions).values(mv.row).onConflictDoNothing();
    }
  }
  for (const mv of movedThinkingScs) {
    if (mv.a === 'repoint') {
      await db.update(demandEntryThinkingScs).set({ systemConditionId: mv.from }).where(eq(demandEntryThinkingScs.id, mv.id));
    } else {
      await db.insert(demandEntryThinkingScs).values(mv.row).onConflictDoNothing();
    }
  }
  for (const mv of movedBlocks) {
    // legacy single-FK block re-point (pre-0032 merge records)
    await db.update(workDescriptionBlocks).set({ systemConditionId: mv.from }).where(eq(workDescriptionBlocks.id, mv.id));
  }
  for (const mv of movedBlockScs) {
    if (mv.a === 'repoint') {
      await db.update(workBlockSystemConditions).set({ systemConditionId: mv.from }).where(eq(workBlockSystemConditions.id, mv.id));
    } else {
      await db.insert(workBlockSystemConditions).values(mv.row).onConflictDoNothing();
    }
  }

  // un-archive the sources (they return to the vocabulary).
  await db.update(systemConditions).set({ archivedAt: null, mergedIntoId: null }).where(inArray(systemConditions.id, sourceIds));
  // restore the surviving condition's label if the merge renamed it.
  if (m.priorTargetLabel != null) {
    await db.update(systemConditions).set({ label: m.priorTargetLabel }).where(eq(systemConditions.id, m.targetId));
  }
  await db.delete(systemConditionMerges).where(eq(systemConditionMerges.id, mergeId));
  return { undone: true };
}

// Recent merges for the synthesis undo log, with source/target labels resolved
// (sources are archived, so includeArchived is needed to name them).
export async function getSystemConditionMerges(studyId: string) {
  const merges = await db.select().from(systemConditionMerges)
    .where(eq(systemConditionMerges.studyId, studyId))
    .orderBy(desc(systemConditionMerges.createdAt));
  if (merges.length === 0) return [];
  const conds = await getSystemConditions(studyId, { includeArchived: true });
  const labelOf = new Map(conds.map((c) => [c.id, c.label]));
  return merges.map((m) => {
    const sourceIds: string[] = JSON.parse(m.sourceIds);
    return {
      id: m.id,
      createdAt: m.createdAt,
      targetId: m.targetId,
      targetLabel: labelOf.get(m.targetId) ?? '(deleted)',
      sources: sourceIds.map((id) => ({ id, label: labelOf.get(id) ?? '(unknown)' })),
    };
  });
}

// Per-condition reference counts across entry attachments + flow work blocks —
// feeds the synthesis histogram. Live (non-archived) conditions only; conditions
// with zero references are still returned so unused labels can be cleaned up too.
// P2BS (life problem) scope filter for entry-based reads. In flow the life problem
// lives on the CASE (entries carry caseId but NULL lifeProblemId), so match entries
// whose case has it OR (transactional) whose own lifeProblemId matches. Returns
// undefined when no filter — drizzle and()/or() ignore undefined args.
async function lifeProblemEntryFilter(studyId: string, lifeProblemId?: string) {
  if (!lifeProblemId) return undefined;
  const caseRows = await db.select({ id: cases.id })
    .from(cases).where(and(eq(cases.studyId, studyId), eq(cases.lifeProblemId, lifeProblemId)));
  const caseIds = caseRows.map((c) => c.id);
  return caseIds.length
    ? or(eq(demandEntries.lifeProblemId, lifeProblemId), inArray(demandEntries.caseId, caseIds))
    : eq(demandEntries.lifeProblemId, lifeProblemId);
}

export async function getSystemConditionFrequencies(studyId: string, lifeProblemId?: string) {
  const conds = await getSystemConditions(studyId);
  if (conds.length === 0) return [] as { id: string; label: string; count: number }[];
  const lpf = await lifeProblemEntryFilter(studyId, lifeProblemId);

  const junctionCounts = await db.select({
    scId: demandEntrySystemConditions.systemConditionId,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntrySystemConditions)
    .innerJoin(demandEntries, eq(demandEntrySystemConditions.demandEntryId, demandEntries.id))
    .where(and(eq(demandEntries.studyId, studyId), lpf))
    .groupBy(demandEntrySystemConditions.systemConditionId);

  const blockCounts = await db.select({
    scId: workBlockSystemConditions.systemConditionId,
    count: sql<number>`count(*)::int`,
  })
    .from(workBlockSystemConditions)
    .innerJoin(workDescriptionBlocks, eq(workBlockSystemConditions.workBlockId, workDescriptionBlocks.id))
    .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
    .where(and(eq(demandEntries.studyId, studyId), lpf))
    .groupBy(workBlockSystemConditions.systemConditionId);

  const tally = new Map<string, number>();
  for (const r of junctionCounts) if (r.scId) tally.set(r.scId, (tally.get(r.scId) ?? 0) + r.count);
  for (const r of blockCounts) if (r.scId) tally.set(r.scId, (tally.get(r.scId) ?? 0) + r.count);

  return conds
    .map((c) => ({ id: c.id, label: c.label, count: tally.get(c.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

// System conditions over time — occurrences per calendar day, per condition.
// Counts entry attachments + flow work blocks, both bucketed by the entry's
// created day (blocks inherit their entry's date, mirroring demandOverTime).
// Live (non-archived) conditions only; flat rows, the client pivots for the chart.
export async function getSystemConditionOverTime(studyId: string, lifeProblemId?: string) {
  const lpf = await lifeProblemEntryFilter(studyId, lifeProblemId);
  const junction = await db.select({
    date: sql<string>`${demandEntries.createdAt}::date`,
    scId: demandEntrySystemConditions.systemConditionId,
    count: sql<number>`count(*)::int`,
  })
    .from(demandEntrySystemConditions)
    .innerJoin(demandEntries, eq(demandEntrySystemConditions.demandEntryId, demandEntries.id))
    .where(and(eq(demandEntries.studyId, studyId), lpf))
    .groupBy(sql`${demandEntries.createdAt}::date`, demandEntrySystemConditions.systemConditionId);

  const blocks = await db.select({
    date: sql<string>`coalesce(${workDescriptionBlocks.blockDate}, ${demandEntries.createdAt})::date`,
    scId: workBlockSystemConditions.systemConditionId,
    count: sql<number>`count(*)::int`,
  })
    .from(workBlockSystemConditions)
    .innerJoin(workDescriptionBlocks, eq(workBlockSystemConditions.workBlockId, workDescriptionBlocks.id))
    .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
    .where(and(eq(demandEntries.studyId, studyId), lpf))
    .groupBy(sql`coalesce(${workDescriptionBlocks.blockDate}, ${demandEntries.createdAt})::date`, workBlockSystemConditions.systemConditionId);

  const live = await getSystemConditions(studyId);
  const liveIds = new Set(live.map((c) => c.id));
  const tally = new Map<string, { date: string; id: string; count: number }>();
  const add = (date: string, scId: string | null, count: number) => {
    if (!scId || !liveIds.has(scId)) return;
    const key = `${date}::${scId}`;
    const cur = tally.get(key);
    if (cur) cur.count += count; else tally.set(key, { date, id: scId, count });
  };
  for (const r of junction) add(r.date, r.scId, r.count);
  for (const r of blocks) add(r.date, r.scId, r.count);
  return [...tally.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ── Generic single-FK taxonomy synthesis (migration 0030) ────────────────────
// Work types + work step types are each linked by ONE foreign key per record,
// so merge is "re-point every linked row from the sources to the survivor, then
// soft-archive the sources" — no junction, no dedupe. One config object per
// taxonomy supplies the concrete table/column queries; everything else is shared.

export type SingleFkTaxonomy = 'work_type' | 'work_step_type';

// Maps the URL segment (/synthesis/<param>/…) to the taxonomy slug.
export function resolveSingleFkTaxonomy(param: string): SingleFkTaxonomy | null {
  if (param === 'work-types') return 'work_type';
  if (param === 'work-step-types') return 'work_step_type';
  return null;
}

function taxConfig(tax: SingleFkTaxonomy) {
  if (tax === 'work_type') {
    return {
      typesTable: workTypes,
      fetchLinks: async (studyId: string, ids: string[]) =>
        (await db.select({ id: demandEntries.id, from: demandEntries.workTypeId })
          .from(demandEntries)
          .where(and(eq(demandEntries.studyId, studyId), inArray(demandEntries.workTypeId, ids))))
          .map((r) => ({ id: r.id, from: r.from as string })),
      setLink: (id: string, value: string) =>
        db.update(demandEntries).set({ workTypeId: value }).where(eq(demandEntries.id, id)),
      countByType: () => db.select({ typeId: demandEntries.workTypeId, count: sql<number>`count(*)::int` })
        .from(demandEntries),
      timeRows: () => db.select({ date: sql<string>`${demandEntries.createdAt}::date`, typeId: demandEntries.workTypeId, count: sql<number>`count(*)::int` })
        .from(demandEntries),
      countWhere: (studyId: string) => and(eq(demandEntries.studyId, studyId), sql`${demandEntries.workTypeId} is not null`),
      countGroup: demandEntries.workTypeId,
      timeGroup: [sql`${demandEntries.createdAt}::date`, demandEntries.workTypeId] as const,
    };
  }
  return {
    typesTable: workStepTypes,
    fetchLinks: async (studyId: string, ids: string[]) =>
      (await db.select({ id: workDescriptionBlocks.id, from: workDescriptionBlocks.workStepTypeId })
        .from(workDescriptionBlocks)
        .innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id))
        .where(and(eq(demandEntries.studyId, studyId), inArray(workDescriptionBlocks.workStepTypeId, ids))))
        .map((r) => ({ id: r.id, from: r.from as string })),
    setLink: (id: string, value: string) =>
      db.update(workDescriptionBlocks).set({ workStepTypeId: value }).where(eq(workDescriptionBlocks.id, id)),
    countByType: () => db.select({ typeId: workDescriptionBlocks.workStepTypeId, count: sql<number>`count(*)::int` })
      .from(workDescriptionBlocks).innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id)),
    timeRows: () => db.select({ date: sql<string>`coalesce(${workDescriptionBlocks.blockDate}, ${demandEntries.createdAt})::date`, typeId: workDescriptionBlocks.workStepTypeId, count: sql<number>`count(*)::int` })
      .from(workDescriptionBlocks).innerJoin(demandEntries, eq(workDescriptionBlocks.demandEntryId, demandEntries.id)),
    countWhere: (studyId: string) => and(eq(demandEntries.studyId, studyId), sql`${workDescriptionBlocks.workStepTypeId} is not null`),
    countGroup: workDescriptionBlocks.workStepTypeId,
    timeGroup: [sql`coalesce(${workDescriptionBlocks.blockDate}, ${demandEntries.createdAt})::date`, workDescriptionBlocks.workStepTypeId] as const,
  };
}

export async function getTaxonomyTypes(studyId: string, tax: SingleFkTaxonomy, opts?: { includeArchived?: boolean }) {
  const tt = taxConfig(tax).typesTable as typeof workTypes;
  const conds = [eq(tt.studyId, studyId)];
  if (!opts?.includeArchived) conds.push(isNull(tt.archivedAt));
  return db.select({ id: tt.id, label: tt.label, archivedAt: tt.archivedAt, mergedIntoId: tt.mergedIntoId, sortOrder: tt.sortOrder })
    .from(tt).where(and(...conds)).orderBy(asc(tt.sortOrder));
}

export async function getTaxonomyFrequencies(studyId: string, tax: SingleFkTaxonomy, lifeProblemId?: string) {
  const cfg = taxConfig(tax);
  const live = await getTaxonomyTypes(studyId, tax);
  if (live.length === 0) return [] as { id: string; label: string; count: number }[];
  const lpf = await lifeProblemEntryFilter(studyId, lifeProblemId);
  const counts = await cfg.countByType().where(and(cfg.countWhere(studyId), lpf)).groupBy(cfg.countGroup);
  const tally = new Map<string, number>();
  for (const c of counts) if (c.typeId) tally.set(c.typeId, c.count);
  return live.map((t) => ({ id: t.id, label: t.label, count: tally.get(t.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function getTaxonomyOverTime(studyId: string, tax: SingleFkTaxonomy, lifeProblemId?: string) {
  const cfg = taxConfig(tax);
  const liveIds = new Set((await getTaxonomyTypes(studyId, tax)).map((t) => t.id));
  const lpf = await lifeProblemEntryFilter(studyId, lifeProblemId);
  const rows = await cfg.timeRows().where(and(cfg.countWhere(studyId), lpf)).groupBy(...cfg.timeGroup);
  return rows.filter((r) => r.typeId && liveIds.has(r.typeId))
    .map((r) => ({ date: r.date, id: r.typeId as string, count: r.count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTaxonomyMerges(studyId: string, tax: SingleFkTaxonomy) {
  const merges = await db.select().from(taxonomyMerges)
    .where(and(eq(taxonomyMerges.studyId, studyId), eq(taxonomyMerges.taxonomy, tax)))
    .orderBy(desc(taxonomyMerges.createdAt));
  if (merges.length === 0) return [];
  const all = await getTaxonomyTypes(studyId, tax, { includeArchived: true });
  const labelOf = new Map(all.map((t) => [t.id, t.label]));
  return merges.map((m) => {
    const sourceIds: string[] = JSON.parse(m.sourceIds);
    return {
      id: m.id,
      createdAt: m.createdAt,
      targetId: m.targetId,
      targetLabel: labelOf.get(m.targetId) ?? '(deleted)',
      sources: sourceIds.map((id) => ({ id, label: labelOf.get(id) ?? '(unknown)' })),
    };
  });
}

export async function renameTaxonomyType(studyId: string, tax: SingleFkTaxonomy, id: string, label: string) {
  const tt = taxConfig(tax).typesTable as typeof workTypes;
  // Synthesis intent: renaming a type to a name a LIVE sibling already has means
  // "these are the same" → merge this one into the existing one instead of
  // creating a duplicate label. Otherwise just relabel.
  const live = await getTaxonomyTypes(studyId, tax);
  const dup = live.find((t) => t.id !== id && t.label === label);
  if (dup) {
    await mergeTaxonomy(studyId, tax, { targetId: dup.id, sourceIds: [id] });
    return;
  }
  await db.update(tt).set({ label }).where(and(eq(tt.id, id), eq(tt.studyId, studyId)));
}

export async function mergeTaxonomy(studyId: string, tax: SingleFkTaxonomy, { targetId, sourceIds, newLabel }: { targetId: string; sourceIds: string[]; newLabel?: string }) {
  const cfg = taxConfig(tax);
  const tt = cfg.typesTable as typeof workTypes;
  const uniqueSources = [...new Set(sourceIds)].filter((id) => id !== targetId);
  if (uniqueSources.length === 0) throw new Error('No source types to merge');

  const all = await db.select({ id: tt.id, label: tt.label, archivedAt: tt.archivedAt })
    .from(tt).where(and(eq(tt.studyId, studyId), inArray(tt.id, [targetId, ...uniqueSources])));
  const byId = new Map(all.map((t) => [t.id, t]));
  const target = byId.get(targetId);
  if (!target) throw new Error('Target type not found in study');
  if (target.archivedAt) throw new Error('Target type is archived');
  for (const sid of uniqueSources) {
    const s = byId.get(sid);
    if (!s) throw new Error('Source type not found in study');
    if (s.archivedAt) throw new Error('Source type already archived');
  }

  // Re-point every linked record (single FK), recording each move for undo.
  const moved = await cfg.fetchLinks(studyId, uniqueSources);
  for (const m of moved) await cfg.setLink(m.id, targetId);

  let priorTargetLabel: string | null = null;
  const trimmed = newLabel?.trim();
  if (trimmed && trimmed !== target.label) {
    priorTargetLabel = target.label;
    await db.update(tt).set({ label: trimmed }).where(eq(tt.id, targetId));
  }

  const archivedAt = new Date();
  await db.update(tt).set({ archivedAt, mergedIntoId: targetId }).where(inArray(tt.id, uniqueSources));

  const mergeId = generateId();
  await db.insert(taxonomyMerges).values({
    id: mergeId, studyId, taxonomy: tax, targetId,
    sourceIds: JSON.stringify(uniqueSources),
    moved: JSON.stringify(moved),
    priorTargetLabel, createdAt: archivedAt,
  });
  return { mergeId, archivedCount: uniqueSources.length };
}

export async function undoTaxonomyMerge(studyId: string, tax: SingleFkTaxonomy, mergeId: string) {
  const cfg = taxConfig(tax);
  const tt = cfg.typesTable as typeof workTypes;
  const [m] = await db.select().from(taxonomyMerges).where(and(
    eq(taxonomyMerges.id, mergeId), eq(taxonomyMerges.studyId, studyId), eq(taxonomyMerges.taxonomy, tax),
  ));
  if (!m) throw new Error('Merge record not found');
  const moved: { id: string; from: string }[] = JSON.parse(m.moved);

  // Chained-merge safety: block if a later merge re-pointed any of the same rows.
  const myRowIds = new Set(moved.map((x) => x.id));
  const later = await db.select({ moved: taxonomyMerges.moved }).from(taxonomyMerges)
    .where(and(eq(taxonomyMerges.studyId, studyId), eq(taxonomyMerges.taxonomy, tax), gt(taxonomyMerges.createdAt, m.createdAt)));
  for (const l of later) {
    const ids: { id: string }[] = JSON.parse(l.moved);
    if (ids.some((x) => myRowIds.has(x.id))) throw new Error('Undo more recent merges first.');
  }

  const sourceIds: string[] = JSON.parse(m.sourceIds);
  for (const mv of moved) await cfg.setLink(mv.id, mv.from);
  await db.update(tt).set({ archivedAt: null, mergedIntoId: null }).where(inArray(tt.id, sourceIds));
  if (m.priorTargetLabel != null) await db.update(tt).set({ label: m.priorTargetLabel }).where(eq(tt.id, m.targetId));
  await db.delete(taxonomyMerges).where(eq(taxonomyMerges.id, mergeId));
  return { undone: true };
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

// Value steps (migration 0047) — editable ORDERED study-level list; a work
// block tags one. Mirrors workStepTypes minus the tag.
export async function getValueSteps(studyId: string) {
  return db.select().from(valueSteps).where(eq(valueSteps.studyId, studyId)).orderBy(asc(valueSteps.sortOrder));
}

export async function addValueStep(studyId: string, label: string) {
  const id = generateId();
  const existing = await getValueSteps(studyId);
  await db.insert(valueSteps).values({ id, studyId, label, sortOrder: existing.length });
  return id;
}

export async function updateValueStep(id: string, data: { label?: string; sortOrder?: number }) {
  const set: typeof data = {};
  if (typeof data.label === 'string' && data.label.trim()) set.label = data.label.trim();
  if (typeof data.sortOrder === 'number') set.sortOrder = data.sortOrder;
  if (Object.keys(set).length === 0) return;
  await db.update(valueSteps).set(set).where(eq(valueSteps.id, id));
}

export async function deleteValueStep(id: string) {
  // work_description_blocks.value_step_id is ON DELETE SET NULL — blocks unset.
  await db.delete(valueSteps).where(eq(valueSteps.id, id));
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
      // failure_demand steps are demands, not work steps — never cluster them
      // into Work Step Types (migration 0033).
      sql`${workDescriptionBlocks.tag} != 'failure_demand'`,
    ));
  return rows as { id: string; text: string; tag: 'value' | 'sequence' | 'failure' }[];
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

function concatWorkBlocks(blocks: { tag: 'value' | 'sequence' | 'failure' | 'failure_demand'; text: string }[]): string {
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
  workBlocks?: { tag: 'value' | 'sequence' | 'failure' | 'failure_demand'; text: string; workStepTypeId?: string | null; systemConditionId?: string | null; systemConditionIds?: string[]; demandTypeId?: string | null; valueStepId?: string | null; date?: string | null }[];
  // Case stitching (Skipton slice 1): which case this touch belongs to.
  caseId?: string | null;
  // C7 (2026-06-17): did the customer feel this touch? (customer-facing COR vs
  // internal/partner handoff). Null = not asked.
  customerFelt?: boolean | null;
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
    caseId: data.caseId || null,
    customerFelt: data.customerFelt ?? null,
  });

  // Insert what matters junction records
  const whatMattersIds = data.whatMattersTypeIds || (data.whatMattersTypeId ? [data.whatMattersTypeId] : []);
  if (isDemand && whatMattersIds.length > 0) {
    // Batched: one multi-row insert instead of one round-trip per row (neon-http).
    await db.insert(demandEntryWhatMatters).values(
      whatMattersIds.map((wmtId) => ({ id: generateId(), demandEntryId: id, whatMattersTypeId: wmtId })),
    );
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
    await db.insert(demandEntrySystemConditions).values(
      scs.map((sc) => {
        // Attachment defaults: if the caller didn't specify any, assume attaches
        // to Demand — matches the old implicit semantics so existing callers
        // (seeder, import, older UI) keep working.
        const anyAttachment = sc.attachesToLifeProblem || sc.attachesToDemand || sc.attachesToWhatMatters || sc.attachesToCor || sc.attachesToWork;
        return {
          id: generateId(),
          demandEntryId: id,
          systemConditionId: sc.id,
          dimension: sc.dimension || 'hinders',
          attachesToLifeProblem: !!sc.attachesToLifeProblem,
          attachesToDemand:      anyAttachment ? !!sc.attachesToDemand : true,
          attachesToWhatMatters: !!sc.attachesToWhatMatters,
          attachesToCor:         !!sc.attachesToCor,
          attachesToWork:        !!sc.attachesToWork,
        };
      }),
    );
  }

  // Insert thinking junction records (mirrors system conditions visibility).
  // Each entry carries a per-pair "logic" (free-text reasoning), a per-thinking
  // helps/hinders dimension (migration 0012), and zero or more SC attachments
  // (migration 0011 — dimension later removed in 0012).
  const ths = data.thinkings || [];
  if (scVisible && ths.length > 0) {
    const scIdsOnEntry = new Set(scs.map((s) => s.id));
    const thRows = ths.map((th) => ({
      id: generateId(),
      demandEntryId: id,
      thinkingId: th.id,
      logic: th.logic || '',
      dimension: (th.dimension === 'helps' ? 'helps' : 'hinders') as 'helps' | 'hinders',
    }));
    const thScRows = ths.flatMap((th) =>
      (th.scAttachments || [])
        // Defensive: only persist attachments for SCs actually on this entry.
        .filter((att) => scIdsOnEntry.has(att.systemConditionId))
        .map((att) => ({ id: generateId(), demandEntryId: id, thinkingId: th.id, systemConditionId: att.systemConditionId })),
    );
    await db.insert(demandEntryThinkings).values(thRows);
    if (thScRows.length > 0) await db.insert(demandEntryThinkingScs).values(thScRows);
  }

  // Insert work-description blocks (Work tab only, Phase 2 / Item 4).
  if (workBlocks.length > 0) {
    const blockRows: (typeof workDescriptionBlocks.$inferInsert)[] = [];
    const blockScRows: (typeof workBlockSystemConditions.$inferInsert)[] = [];
    let order = 0;
    for (const block of workBlocks) {
      const scIds = [...new Set(block.systemConditionIds ?? (block.systemConditionId ? [block.systemConditionId] : []))];
      const blockId = generateId();
      blockRows.push({
        id: blockId,
        demandEntryId: id,
        tag: block.tag,
        text: block.text,
        sortOrder: order++,
        workStepTypeId: block.workStepTypeId ?? null,
        systemConditionId: scIds[0] ?? null, // legacy column kept for back-compat; junction is source of truth
        blockDate: block.date ? new Date(block.date) : null,
        // Per-block failure-demand type (0033): only 'failure demand' steps carry one.
        demandTypeId: block.tag === 'failure_demand' ? (block.demandTypeId ?? null) : null,
        valueStepId: block.valueStepId ?? null,
      });
      for (const scId of scIds) {
        blockScRows.push({ id: generateId(), workBlockId: blockId, systemConditionId: scId });
      }
    }
    await db.insert(workDescriptionBlocks).values(blockRows);
    if (blockScRows.length > 0) await db.insert(workBlockSystemConditions).values(blockScRows);
  }

  return id;
}

// --- Case stitching (Skipton slice 1, 2026-06-11) ---
// A case is a container: one privacy-safe reference number = one customer =
// one value demand. Entries attach via demandEntries.caseId; the timeline of
// touches ordered by createdAt is the repeatable Capability-of-Response record.

export async function findOrCreateCase(studyId: string, caseRef: string, opts?: {
  demandTypeId?: string | null;
  openedAt?: Date;
  collectorName?: string | null;
}) {
  const ref = caseRef.trim();
  if (!ref) throw new Error('caseRef is required');
  // Upsert: two collectors may type the same new ref at the same moment.
  // ON CONFLICT DO NOTHING + re-select guarantees exactly one case row.
  await db.insert(cases).values({
    id: generateId(),
    studyId,
    caseRef: ref,
    demandTypeId: opts?.demandTypeId || null,
    status: 'open',
    openedAt: opts?.openedAt || new Date(),
    createdByCollector: opts?.collectorName || null,
    createdAt: new Date(),
  }).onConflictDoNothing();
  const rows = await db.select().from(cases)
    .where(and(eq(cases.studyId, studyId), eq(cases.caseRef, ref)));
  // Keep the value-demand junction in sync with the primary column seeded above,
  // so a case created with a "big flow" shows it in the multi-select green box.
  if (opts?.demandTypeId && rows[0]) {
    await db.insert(caseDemandTypes)
      .values({ id: generateId(), caseId: rows[0].id, demandTypeId: opts.demandTypeId })
      .onConflictDoNothing();
  }
  return rows[0];
}

export async function getCaseByRef(studyId: string, caseRef: string) {
  const rows = await db.select().from(cases)
    .where(and(eq(cases.studyId, studyId), eq(cases.caseRef, caseRef.trim())));
  return rows[0] || null;
}

export async function getCases(studyId: string) {
  // List newest-first with a per-case entry count for the settings/dashboard list.
  return db.select({
    id: cases.id,
    caseRef: cases.caseRef,
    demandTypeId: cases.demandTypeId,
    // C5 case-search table (2026-06-17): P2BS + What Matters so the entry screen
    // can show an overview (Account Number / P2BS / Demand / What Matters).
    lifeProblemId: cases.lifeProblemId,
    // Multi-select sets (2026-07-02), ordered by junction id so the "first" is
    // stable (earliest added) — matches the primary single column above.
    lifeProblemIds: sql<string | null>`(select string_agg(clp.life_problem_id, ',' order by clp.id) from case_life_problems clp where clp.case_id = cases.id)`,
    demandTypeIds: sql<string | null>`(select string_agg(cdt.demand_type_id, ',' order by cdt.id) from case_demand_types cdt where cdt.case_id = cases.id)`,
    whatMattersTypeIds: sql<string | null>`(select string_agg(cwm.what_matters_type_id, ',') from case_what_matters cwm where cwm.case_id = cases.id)`,
    status: cases.status,
    openedAt: cases.openedAt,
    closedAt: cases.closedAt,
    note: cases.note,
    createdByCollector: cases.createdByCollector,
    createdAt: cases.createdAt,
    // Explicitly qualified: drizzle renders interpolated columns unqualified
    // here, which made the correlated subquery compare demand_entries.case_id
    // to demand_entries.id (always 0 rows).
    entryCount: sql<number>`(select count(*)::int from demand_entries de where de.case_id = cases.id)`,
    // Latest touch (2026-06-18): its date + verbatim so the entry-screen recent
    // list can show "last touch" for recognition. Same `de` alias / explicit
    // qualification as entryCount above (drizzle correlated-subquery gotcha).
    lastEntryAt: sql<string | null>`(select de.created_at from demand_entries de where de.case_id = cases.id order by de.created_at desc limit 1)`,
    lastEntryVerbatim: sql<string | null>`(select de.verbatim from demand_entries de where de.case_id = cases.id order by de.created_at desc limit 1)`,
  })
    .from(cases)
    .where(eq(cases.studyId, studyId))
    .orderBy(desc(cases.createdAt));
}

export async function getCase(caseId: string) {
  const rows = await db.select().from(cases).where(eq(cases.id, caseId));
  return rows[0] || null;
}

// Timeline of touches for one case, oldest first — this IS the COR+ sequence.
// Each row is enriched with the distinct non-null system-condition ids attached
// to its work blocks (comma-joined), so the saved-touch card can show the SC(s)
// driving it. Mirrors the string_agg pattern used in getCases.
export async function getCaseEntries(caseId: string) {
  return db.select({
    id: demandEntries.id,
    studyId: demandEntries.studyId,
    caseId: demandEntries.caseId,
    createdAt: demandEntries.createdAt,
    verbatim: demandEntries.verbatim,
    classification: demandEntries.classification,
    entryType: demandEntries.entryType,
    handlingTypeId: demandEntries.handlingTypeId,
    collectorName: demandEntries.collectorName,
    customerFelt: demandEntries.customerFelt,
    systemConditionIds: sql<string | null>`(select string_agg(distinct wbsc.system_condition_id, ',') from work_block_system_conditions wbsc join work_description_blocks wdb on wdb.id = wbsc.work_block_id where wdb.demand_entry_id = demand_entries.id)`,
    // Explicit drag-reorder position (migration 0034). NULL = never reordered.
    sortOrder: demandEntries.sortOrder,
    // The touch's effective date = earliest block date, else created_at — what the
    // timeline displays/orders by and what capability/over-time charts bucket on.
    effectiveAt: sql<string>`coalesce((select min(wdb.block_date) from work_description_blocks wdb where wdb.demand_entry_id = demand_entries.id), demand_entries.created_at)`,
  })
    .from(demandEntries)
    .where(eq(demandEntries.caseId, caseId))
    // sort_order drives the order once a case has been reordered; NULLS LAST keeps
    // un-reordered cases (all-NULL) in created_at order, and a touch captured after
    // a reorder (NULL) sorts last = rightmost/newest.
    .orderBy(sql`${demandEntries.sortOrder} asc nulls last`, asc(demandEntries.createdAt));
}

// Drag-reorder a flow case's touches (migration 0034). Renumbers sort_order for
// every entry in the case to match orderedIds, and — when a touch was moved — sets
// its effective date by writing the chosen day to ALL its work blocks' block_date
// (a multi-day touch collapses to one day; the edit modal stays the finer tool).
// created_at is left untouched (immutable audit timestamp).
export async function reorderCaseEntries(
  caseId: string,
  orderedIds: string[],
  moved?: { id: string; date: string },
) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(demandEntries).set({ sortOrder: i })
      .where(and(eq(demandEntries.id, orderedIds[i]), eq(demandEntries.caseId, caseId)));
  }
  if (moved) {
    await db.update(workDescriptionBlocks)
      .set({ blockDate: new Date(moved.date) })
      .where(eq(workDescriptionBlocks.demandEntryId, moved.id));
  }
}

export async function updateCase(caseId: string, data: {
  demandTypeId?: string | null;
  status?: 'open' | 'closed';
  openedAt?: Date;
  closedAt?: Date | null;
  // 0043: defaults to 'manual' on an explicit close so recompute won't reopen it.
  closedReason?: 'final_milestone' | 'manual' | null;
  note?: string | null;
  // Flow-mode person context (slice B).
  contextSituation?: string | null;
  lifeProblemId?: string | null;
  whatMatters?: string | null;
  whatMattersTypeIds?: string[];
  // Multi-select life problems / value demands (2026-07-02). When provided, the
  // junctions are diff-set and the primary single column above is synced to the
  // first id (or null) so dashboards/export keep reading one value.
  lifeProblemIds?: string[];
  demandTypeIds?: string[];
}) {
  const updateFields: Record<string, unknown> = {};
  if (data.demandTypeId !== undefined) updateFields.demandTypeId = data.demandTypeId;
  if (data.status !== undefined) {
    updateFields.status = data.status;
    // Closing stamps closedAt unless the caller supplies one; reopening clears it.
    if (data.status === 'closed' && data.closedAt === undefined) updateFields.closedAt = new Date();
    if (data.status === 'open' && data.closedAt === undefined) updateFields.closedAt = null;
    // 0043: an explicit close is 'manual' unless the caller says otherwise (the
    // auto-close from recomputeCaseClosure passes 'final_milestone'); reopening clears it.
    if (data.status === 'closed' && data.closedReason === undefined) updateFields.closedReason = 'manual';
    if (data.status === 'open' && data.closedReason === undefined) updateFields.closedReason = null;
  }
  if (data.openedAt !== undefined) updateFields.openedAt = data.openedAt;
  if (data.closedAt !== undefined) updateFields.closedAt = data.closedAt;
  if (data.closedReason !== undefined) updateFields.closedReason = data.closedReason;
  if (data.note !== undefined) updateFields.note = data.note;
  if (data.contextSituation !== undefined) updateFields.contextSituation = data.contextSituation;
  if (data.lifeProblemId !== undefined) updateFields.lifeProblemId = data.lifeProblemId;
  if (data.whatMatters !== undefined) updateFields.whatMatters = data.whatMatters;
  // Sync the primary single columns to the first of each multi-select set so the
  // P2BS dashboard filter / CSV export keep working off one value. Array wins
  // over any single-field value passed in the same call.
  if (data.lifeProblemIds !== undefined) updateFields.lifeProblemId = data.lifeProblemIds[0] ?? null;
  if (data.demandTypeIds !== undefined) updateFields.demandTypeId = data.demandTypeIds[0] ?? null;
  if (Object.keys(updateFields).length > 0) {
    await db.update(cases).set(updateFields).where(eq(cases.id, caseId));
  }
  // DIFF-set semantics (2026-07-01): delete only removed types and insert only
  // added ones, so a kept row's target_date survives toggling other pills.
  // (Was delete-all + reinsert, which wiped every captured date on any toggle.)
  if (data.whatMattersTypeIds !== undefined) {
    const desired = new Set(data.whatMattersTypeIds);
    const current = await db.select().from(caseWhatMatters).where(eq(caseWhatMatters.caseId, caseId));
    const currentIds = new Set(current.map((r) => r.whatMattersTypeId));
    for (const r of current) {
      if (!desired.has(r.whatMattersTypeId)) {
        await db.delete(caseWhatMatters).where(eq(caseWhatMatters.id, r.id));
      }
    }
    for (const wmtId of data.whatMattersTypeIds) {
      if (currentIds.has(wmtId)) continue;
      await db.insert(caseWhatMatters).values({ id: generateId(), caseId, whatMattersTypeId: wmtId });
    }
  }
  // Same diff-set for the life-problem and value-demand junctions (2026-07-02).
  if (data.lifeProblemIds !== undefined) {
    const desired = new Set(data.lifeProblemIds);
    const current = await db.select().from(caseLifeProblems).where(eq(caseLifeProblems.caseId, caseId));
    const currentIds = new Set(current.map((r) => r.lifeProblemId));
    for (const r of current) {
      if (!desired.has(r.lifeProblemId)) await db.delete(caseLifeProblems).where(eq(caseLifeProblems.id, r.id));
    }
    for (const lpId of data.lifeProblemIds) {
      if (currentIds.has(lpId)) continue;
      await db.insert(caseLifeProblems).values({ id: generateId(), caseId, lifeProblemId: lpId });
    }
  }
  if (data.demandTypeIds !== undefined) {
    const desired = new Set(data.demandTypeIds);
    const current = await db.select().from(caseDemandTypes).where(eq(caseDemandTypes.caseId, caseId));
    const currentIds = new Set(current.map((r) => r.demandTypeId));
    for (const r of current) {
      if (!desired.has(r.demandTypeId)) await db.delete(caseDemandTypes).where(eq(caseDemandTypes.id, r.id));
    }
    for (const dtId of data.demandTypeIds) {
      if (currentIds.has(dtId)) continue;
      await db.insert(caseDemandTypes).values({ id: generateId(), caseId, demandTypeId: dtId });
    }
  }
}

export async function getCaseWhatMatters(caseId: string) {
  return db.select().from(caseWhatMatters).where(eq(caseWhatMatters.caseId, caseId));
}

// Multi-select id arrays for a case's life problems / value demands, ordered by
// junction id so the first is the stable "primary" (mirrors getCases ordering).
export async function getCaseLifeProblemIds(caseId: string): Promise<string[]> {
  const rows = await db.select({ id: caseLifeProblems.lifeProblemId }).from(caseLifeProblems)
    .where(eq(caseLifeProblems.caseId, caseId)).orderBy(asc(caseLifeProblems.id));
  return rows.map((r) => r.id);
}

export async function getCaseDemandTypeIds(caseId: string): Promise<string[]> {
  const rows = await db.select({ id: caseDemandTypes.demandTypeId }).from(caseDemandTypes)
    .where(eq(caseDemandTypes.caseId, caseId)).orderBy(asc(caseDemandTypes.id));
  return rows.map((r) => r.id);
}

// Set (or clear) the customer's wanted date for one 'by_date' what-matters type
// on a case. Upserts the junction row so setting a date also selects the type.
export async function setCaseWhatMattersDate(caseId: string, whatMattersTypeId: string, date: Date | null) {
  const existing = await db.select().from(caseWhatMatters)
    .where(and(eq(caseWhatMatters.caseId, caseId), eq(caseWhatMatters.whatMattersTypeId, whatMattersTypeId)));
  if (existing.length) {
    await db.update(caseWhatMatters).set({ targetDate: date }).where(eq(caseWhatMatters.id, existing[0].id));
  } else {
    await db.insert(caseWhatMatters).values({ id: generateId(), caseId, whatMattersTypeId, targetDate: date });
  }
}

// Structured ask value for a valueKind what-matters type on a case (2026-07-02).
// The client always sends the COMPLETE six-field object and all six columns are
// written, so switching specific↔range or date↔duration atomically nulls the
// abandoned shape. Upserts like setCaseWhatMattersDate — setting a value also
// selects the pill.
export interface CaseWhatMattersValue {
  targetDate: Date | null;
  amountSpecific: number | null;
  amountMin: number | null;
  amountMax: number | null;
  termYears: number | null;
  termMonths: number | null;
}

export async function setCaseWhatMattersValue(caseId: string, whatMattersTypeId: string, value: CaseWhatMattersValue) {
  const existing = await db.select().from(caseWhatMatters)
    .where(and(eq(caseWhatMatters.caseId, caseId), eq(caseWhatMatters.whatMattersTypeId, whatMattersTypeId)));
  if (existing.length) {
    await db.update(caseWhatMatters).set(value).where(eq(caseWhatMatters.id, existing[0].id));
  } else {
    await db.insert(caseWhatMatters).values({ id: generateId(), caseId, whatMattersTypeId, ...value });
  }
}

// --- Milestone subquestions (decision-box redesign, 2026-07-02) ---

// Decision-box redesign (0042): the new-study seed. Replaces
// seedDefaultDecisionPointTypes — a fresh study gets one milestone with the
// person/property/value decisions as required CHOICE subquestions, each with an
// Accept (positive) / Decline (negative) option. Same starter shape consultants
// know, in the flattened model; they add richer subquestions (amount, date,
// duration, text, preset choice lists like confidence A–U or payment dates)
// per study in Settings.
export async function seedDefaultSubquestions(studyId: string, locale: Locale = 'en') {
  // Skip if the study already has subquestions (fresh seed OR migrated).
  const existingSq = await db.select({ id: subquestions.id }).from(subquestions)
    .innerJoin(milestones, eq(subquestions.milestoneId, milestones.id))
    .where(eq(milestones.studyId, studyId)).limit(1);
  if (existingSq.length > 0) return;
  // Reuse the first milestone if one exists (e.g. legacy default), else create.
  let milestoneId = (await db.select({ id: milestones.id }).from(milestones)
    .where(eq(milestones.studyId, studyId)).orderBy(asc(milestones.sortOrder)).limit(1))[0]?.id;
  if (!milestoneId) {
    milestoneId = generateId();
    await db.insert(milestones).values({ id: milestoneId, studyId, label: DEFAULT_MILESTONE_LABEL[locale], sortOrder: 0 });
  }
  const defaults = DEFAULT_DECISION_POINT_TYPES[locale];
  for (let i = 0; i < defaults.length; i++) {
    const sqId = generateId();
    await db.insert(subquestions).values({
      id: sqId, milestoneId, label: defaults[i].label, kind: 'choice', required: true,
      linkedWhatMattersTypeId: null, sortOrder: i, migratedFromFieldId: null,
    });
    await db.insert(subquestionOptions).values([
      { id: generateId(), subquestionId: sqId, label: defaults[i].positiveLabel, polarity: 'positive', sortOrder: 0 },
      { id: generateId(), subquestionId: sqId, label: defaults[i].negativeLabel, polarity: 'negative', sortOrder: 1 },
    ]);
  }
}

// ── Decision-box redesign (0042, 2026-07-02): subquestions on milestones ──────
// Replaces the decisionPointType/outcome/captureField trio above. A subquestion
// is a typed box under a milestone; choice options can carry polarity; filling
// the required ones completes the milestone (recomputeCaseMilestone).

export type SubquestionKind = 'amount' | 'number' | 'percent' | 'currency' | 'calculated' | 'date' | 'duration' | 'duration_months' | 'text' | 'choice';
export type OptionPolarity = 'positive' | 'negative';

// Field-type edit compatibility lives in a client-safe module (see 0054); re-export
// so server callers can import it from here alongside the rest of the data layer.
export { kindsCompatible, compatibleKinds };

export interface AnswerShape {
  valueNumber: number | null;
  valueDate: Date | null;
  valueYears: number | null;
  valueMonths: number | null;
  valueChoice: string | null;
  valueText: string | null;
}

// True when an answer row actually carries a value for a subquestion of `kind`.
export function answerIsFilled(kind: SubquestionKind, a: Partial<AnswerShape>): boolean {
  switch (kind) {
    case 'amount':
    case 'number':
    case 'percent':
    case 'currency':
    case 'calculated': return a.valueNumber != null;
    case 'date': return a.valueDate != null;
    case 'duration':
    case 'duration_months': return a.valueYears != null || a.valueMonths != null;
    case 'text': return a.valueText != null && a.valueText.trim() !== '';
    case 'choice': return a.valueChoice != null && a.valueChoice !== '';
    default: return false;
  }
}

// All of a study's subquestions with their options nested, ordered by milestone
// then subquestion — the study payload nests these under each milestone.
export async function getSubquestions(studyId: string) {
  const rows = await db
    .select({
      id: subquestions.id,
      milestoneId: subquestions.milestoneId,
      label: subquestions.label,
      kind: subquestions.kind,
      required: subquestions.required,
      linkedWhatMattersTypeId: subquestions.linkedWhatMattersTypeId,
      currencyCode: subquestions.currencyCode,
      formula: subquestions.formula,
      resultFormat: subquestions.resultFormat,
      sortOrder: subquestions.sortOrder,
    })
    .from(subquestions)
    .innerJoin(milestones, eq(subquestions.milestoneId, milestones.id))
    .where(eq(milestones.studyId, studyId))
    .orderBy(asc(subquestions.sortOrder));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  // The four child selects are independent — run them concurrently to avoid
  // stacking Neon round-trip latency (0056 perf).
  const [opts, conds, excls, opts2] = await Promise.all([
    db.select().from(subquestionOptions).where(inArray(subquestionOptions.subquestionId, ids)).orderBy(asc(subquestionOptions.sortOrder)),
    db.select().from(subquestionConditions).where(inArray(subquestionConditions.subquestionId, ids)),
    db.select().from(subquestionDemandTypeExclusions).where(inArray(subquestionDemandTypeExclusions.subquestionId, ids)),
    db.select().from(subquestionDemandTypeOptional).where(inArray(subquestionDemandTypeOptional.subquestionId, ids)),
  ]);
  return rows.map((r) => ({
    ...r,
    options: opts.filter((o) => o.subquestionId === r.id)
      .map((o) => ({ id: o.id, label: o.label, polarity: o.polarity, sortOrder: o.sortOrder })),
    conditions: conds.filter((c) => c.subquestionId === r.id)
      .map((c) => ({ id: c.id, parentSubquestionId: c.parentSubquestionId, triggerValue: c.triggerValue })),
    demandTypeExclusions: excls.filter((e) => e.subquestionId === r.id).map((e) => e.demandTypeId),
    demandTypeOptional: opts2.filter((e) => e.subquestionId === r.id).map((e) => e.demandTypeId),
  }));
}

// A study's nested subquestions (from getSubquestions) — passed around so the
// save path loads them once and reuses them across the recompute helpers.
export type SubquestionList = Awaited<ReturnType<typeof getSubquestions>>;

export async function addSubquestion(milestoneId: string, data: { label: string; kind: SubquestionKind; required?: boolean; linkedWhatMattersTypeId?: string | null; currencyCode?: string | null; formula?: string | null; resultFormat?: string | null }) {
  const existing = await db.select().from(subquestions).where(eq(subquestions.milestoneId, milestoneId));
  const row = {
    id: generateId(),
    milestoneId,
    label: data.label,
    kind: data.kind,
    required: data.required ?? true,
    linkedWhatMattersTypeId: data.linkedWhatMattersTypeId ?? null,
    currencyCode: data.currencyCode ?? null,
    formula: data.formula ?? null,
    resultFormat: data.resultFormat ?? null,
    sortOrder: existing.length,
    migratedFromFieldId: null,
  };
  await db.insert(subquestions).values(row);
  return row;
}

// Kind is immutable after create (a subquestion's shape is fundamental; changing
// it would strand typed case answers). Moving to another milestone is allowed —
// case answers survive (keyed on case+subquestion).
export async function updateSubquestion(id: string, data: { label?: string; required?: boolean; kind?: SubquestionKind; linkedWhatMattersTypeId?: string | null; currencyCode?: string | null; formula?: string | null; resultFormat?: string | null; sortOrder?: number; milestoneId?: string }) {
  const set: Record<string, unknown> = {};
  if (data.label !== undefined) set.label = data.label;
  if (data.required !== undefined) set.required = data.required;
  // Kind is editable only within its compatibility class (same answer column, so
  // captured answers survive) — see kindsCompatible. A cross-class change is
  // silently ignored here; the API route rejects it with 400.
  if (data.kind !== undefined) {
    const current = (await db.select({ kind: subquestions.kind }).from(subquestions).where(eq(subquestions.id, id)))[0];
    if (current && kindsCompatible(current.kind as SubquestionKind, data.kind)) set.kind = data.kind;
  }
  if (data.linkedWhatMattersTypeId !== undefined) set.linkedWhatMattersTypeId = data.linkedWhatMattersTypeId;
  if (data.currencyCode !== undefined) set.currencyCode = data.currencyCode;
  if (data.formula !== undefined) set.formula = data.formula;
  if (data.resultFormat !== undefined) set.resultFormat = data.resultFormat;
  if (data.sortOrder !== undefined) set.sortOrder = data.sortOrder;
  if (data.milestoneId !== undefined) {
    set.milestoneId = data.milestoneId;
    if (data.sortOrder === undefined) {
      const existing = await db.select().from(subquestions).where(eq(subquestions.milestoneId, data.milestoneId));
      set.sortOrder = existing.length;
    }
  }
  if (Object.keys(set).length === 0) return;
  await db.update(subquestions).set(set).where(eq(subquestions.id, id));
}

export async function getSubquestionById(id: string) {
  const rows = await db.select().from(subquestions).where(eq(subquestions.id, id));
  return rows[0] || null;
}

export async function deleteSubquestion(id: string) {
  // options + case answers cascade at the DB level (consultant taxonomy fix).
  await db.delete(subquestions).where(eq(subquestions.id, id));
}

export async function addSubquestionOption(subquestionId: string, data: { label: string; polarity?: OptionPolarity | null }) {
  const existing = await db.select().from(subquestionOptions).where(eq(subquestionOptions.subquestionId, subquestionId));
  const row = { id: generateId(), subquestionId, label: data.label, polarity: data.polarity ?? null, sortOrder: existing.length };
  await db.insert(subquestionOptions).values(row);
  return row;
}

export async function updateSubquestionOption(id: string, data: { label?: string; polarity?: OptionPolarity | null; sortOrder?: number }) {
  const set: Record<string, unknown> = {};
  if (data.label !== undefined) set.label = data.label;
  if (data.polarity !== undefined) set.polarity = data.polarity;
  if (data.sortOrder !== undefined) set.sortOrder = data.sortOrder;
  if (Object.keys(set).length === 0) return;
  // Rename cascade: choice answers (value_choice) and branch triggers
  // (subquestion_conditions.trigger_value) both store the option LABEL, so a
  // rename must carry through to them — otherwise a saved answer would silently
  // de-select and a wired branch would stop firing. Runs only on a real change.
  if (data.label !== undefined) {
    const cur = (await db.select().from(subquestionOptions).where(eq(subquestionOptions.id, id)))[0];
    if (cur && cur.label !== data.label) {
      await db.update(caseSubquestionAnswers)
        .set({ valueChoice: data.label })
        .where(and(eq(caseSubquestionAnswers.subquestionId, cur.subquestionId), eq(caseSubquestionAnswers.valueChoice, cur.label)));
      await db.update(subquestionConditions)
        .set({ triggerValue: data.label })
        .where(and(eq(subquestionConditions.parentSubquestionId, cur.subquestionId), eq(subquestionConditions.triggerValue, cur.label)));
    }
  }
  await db.update(subquestionOptions).set(set).where(eq(subquestionOptions.id, id));
}

export async function deleteSubquestionOption(id: string) {
  await db.delete(subquestionOptions).where(eq(subquestionOptions.id, id));
}

// ── Conditional visibility (0050) ────────────────────────────────────────────
export async function addSubquestionCondition(subquestionId: string, parentSubquestionId: string, triggerValue: string) {
  const row = { id: generateId(), subquestionId, parentSubquestionId, triggerValue };
  await db.insert(subquestionConditions).values(row).onConflictDoNothing();
  return row;
}

export async function deleteSubquestionCondition(id: string) {
  await db.delete(subquestionConditions).where(eq(subquestionConditions.id, id));
}

export async function getSubquestionConditionsForSubquestion(subquestionId: string) {
  return db.select().from(subquestionConditions).where(eq(subquestionConditions.subquestionId, subquestionId));
}

// Visible subquestion ids for a case: the study's subquestions (with their
// conditions) resolved against the case's current choice answers, via the shared
// pure rule. A subquestion with no conditions is always visible (back-compat).
export async function getCaseVisibleSubquestionIds(caseId: string, studyId: string, preSubqs?: SubquestionList): Promise<Set<string>> {
  const subqs = preSubqs ?? await getSubquestions(studyId);
  const answers = await db.select({ subquestionId: caseSubquestionAnswers.subquestionId, valueChoice: caseSubquestionAnswers.valueChoice })
    .from(caseSubquestionAnswers).where(eq(caseSubquestionAnswers.caseId, caseId));
  const choiceBySubqId = new Map(answers.map((a) => [a.subquestionId, a.valueChoice]));
  return visibleSubquestionIds(subqs.map((s) => ({ id: s.id, conditions: s.conditions })), choiceBySubqId);
}

// Delete any case answers whose subquestion is currently HIDDEN (a since-changed
// parent), so a stale answer never lingers nor counts toward completion. Returns
// the milestoneIds whose answers were cleared. Accepts precomputed subqs/visible
// (from a caller that already loaded them) to avoid re-querying.
export async function clearHiddenCaseAnswers(caseId: string, studyId: string, preSubqs?: SubquestionList, preVisible?: Set<string>): Promise<string[]> {
  const subqs = preSubqs ?? await getSubquestions(studyId);
  const visible = preVisible ?? await getCaseVisibleSubquestionIds(caseId, studyId, subqs);
  const answers = await db.select().from(caseSubquestionAnswers).where(eq(caseSubquestionAnswers.caseId, caseId));
  const msBySubq = new Map(subqs.map((s) => [s.id, s.milestoneId]));
  const clearedMs = new Set<string>();
  for (const a of answers) {
    if (visible.has(a.subquestionId)) continue;
    await db.delete(caseSubquestionAnswers).where(eq(caseSubquestionAnswers.id, a.id));
    const ms = msBySubq.get(a.subquestionId);
    if (ms) clearedMs.add(ms);
  }
  return [...clearedMs];
}

export async function getCaseSubquestionAnswers(caseId: string) {
  return db.select().from(caseSubquestionAnswers).where(eq(caseSubquestionAnswers.caseId, caseId));
}

// Upsert per-case answers. answered_at is FROZEN at first fill — editing an
// answered subquestion never moves the completion date. An empty payload for a
// subquestion CLEARS it (deletes the row). Returns the distinct milestoneIds
// whose completion the caller should recompute.
export async function setCaseSubquestionAnswers(
  caseId: string,
  answers: ({ subquestionId: string } & AnswerShape & { recordedByCollector?: string | null; answeredAt?: Date | null })[],
): Promise<string[]> {
  if (answers.length === 0) return [];
  const ids = answers.map((a) => a.subquestionId);
  const sqRows = await db.select({ id: subquestions.id, milestoneId: subquestions.milestoneId, kind: subquestions.kind })
    .from(subquestions).where(inArray(subquestions.id, ids));
  const kindById = new Map(sqRows.map((s) => [s.id, s.kind as SubquestionKind]));
  const msById = new Map(sqRows.map((s) => [s.id, s.milestoneId]));
  const existing = await db.select().from(caseSubquestionAnswers)
    .where(and(eq(caseSubquestionAnswers.caseId, caseId), inArray(caseSubquestionAnswers.subquestionId, ids)));
  const existingBySq = new Map(existing.map((e) => [e.subquestionId, e]));
  const touched = new Set<string>();
  for (const a of answers) {
    const kind = kindById.get(a.subquestionId);
    if (!kind) continue; // unknown subquestion — ignore
    const ms = msById.get(a.subquestionId);
    if (ms) touched.add(ms);
    const filled = answerIsFilled(kind, a);
    if (!filled) {
      await db.delete(caseSubquestionAnswers)
        .where(and(eq(caseSubquestionAnswers.caseId, caseId), eq(caseSubquestionAnswers.subquestionId, a.subquestionId)));
      continue;
    }
    // Freeze at first fill: keep an existing answer's date; a new answer takes
    // the caller-supplied date (backdated capture) or now.
    const answeredAt = existingBySq.get(a.subquestionId)?.answeredAt ?? a.answeredAt ?? new Date();
    await db.insert(caseSubquestionAnswers)
      .values({
        id: generateId(), caseId, subquestionId: a.subquestionId,
        valueNumber: a.valueNumber, valueDate: a.valueDate, valueYears: a.valueYears,
        valueMonths: a.valueMonths, valueChoice: a.valueChoice, valueText: a.valueText,
        answeredAt, recordedByCollector: a.recordedByCollector ?? null,
      })
      .onConflictDoUpdate({
        target: [caseSubquestionAnswers.caseId, caseSubquestionAnswers.subquestionId],
        set: {
          valueNumber: a.valueNumber, valueDate: a.valueDate, valueYears: a.valueYears,
          valueMonths: a.valueMonths, valueChoice: a.valueChoice, valueText: a.valueText,
          answeredAt, recordedByCollector: a.recordedByCollector ?? null,
        },
      });
  }
  return [...touched];
}

// THE derivation. A milestone is complete for a case when every REQUIRED
// subquestion is answered; its reachedAt is the latest of those answers. Keeps
// a derived=true case_milestones row in sync; never touches a derived=false
// (legacy/manual) row. Returns whether the milestone is (now) complete.
export async function recomputeCaseMilestone(
  caseId: string,
  milestoneId: string,
  visible?: Set<string>,
  applicable?: Set<string>,
  excludedIn?: Set<string>,
  optionalIn?: Set<string>,
  // Precomputed to avoid per-milestone round-trips when a caller (the save loop)
  // already holds them: the study's subquestions, its id, and the case's existing
  // caseMilestones keyed by milestoneId.
  preSubqs?: SubquestionList,
  studyIdIn?: string,
  existingByMs?: Map<string, { id: string; derived: boolean | null }>,
): Promise<boolean> {
  const reqRows = preSubqs
    ? preSubqs.filter((s) => s.milestoneId === milestoneId && s.required).map((s) => ({ id: s.id, kind: s.kind }))
    : await db.select({ id: subquestions.id, kind: subquestions.kind })
        .from(subquestions)
        .where(and(eq(subquestions.milestoneId, milestoneId), eq(subquestions.required, true)));

  const existing = existingByMs
    ? existingByMs.get(milestoneId)
    : (await db.select().from(caseMilestones)
        .where(and(eq(caseMilestones.caseId, caseId), eq(caseMilestones.milestoneId, milestoneId))))[0];
  // Frozen legacy/manual completion — its existence means complete; leave as is.
  if (existing && !existing.derived) return true;

  const studyId = studyIdIn ?? (await db.select({ studyId: milestones.studyId }).from(milestones).where(eq(milestones.id, milestoneId)))[0]?.studyId ?? null;

  // Dynamic milestones (0051): a milestone that doesn't apply to this case (its
  // demand-type scope doesn't intersect) never completes — drop any derived row.
  const app = applicable ?? (studyId ? await getApplicableMilestoneIds(caseId, studyId) : new Set<string>());
  if (!app.has(milestoneId)) {
    if (existing && existing.derived) await db.delete(caseMilestones).where(eq(caseMilestones.id, existing.id));
    return false;
  }

  // No required subquestions → nothing to complete implicitly.
  if (reqRows.length === 0) {
    if (existing && existing.derived) await db.delete(caseMilestones).where(eq(caseMilestones.id, existing.id));
    return false;
  }

  // Conditional visibility (0050): a required-but-HIDDEN subquestion does not
  // gate — only currently-visible required subquestions must be answered.
  // Per-subquestion demand-type exclusions (0054) hide + un-gate; the
  // not-mandatory set (0055) keeps the question shown but drops it from gating.
  // Both are removed here for this case (exclude-wins is automatic).
  const vis = visible ?? (studyId ? await getCaseVisibleSubquestionIds(caseId, studyId) : new Set<string>());
  const excluded = excludedIn ?? (studyId ? await getCaseExcludedSubquestionIds(caseId, studyId) : new Set<string>());
  const optional = optionalIn ?? (studyId ? await getCaseOptionalSubquestionIds(caseId, studyId) : new Set<string>());
  const visibleReq = reqRows.filter((r) => vis!.has(r.id) && !excluded.has(r.id) && !optional.has(r.id));
  // Every required subquestion is conditionally hidden for this case → there is
  // nothing to gate on. Don't auto-complete an empty milestone (whole-milestone
  // skipping by demand type is a separate concern — see Slice 5). Leave open.
  if (visibleReq.length === 0) {
    if (existing && existing.derived) await db.delete(caseMilestones).where(eq(caseMilestones.id, existing.id));
    return false;
  }

  const answers = await db.select().from(caseSubquestionAnswers)
    .where(and(eq(caseSubquestionAnswers.caseId, caseId), inArray(caseSubquestionAnswers.subquestionId, visibleReq.map((r) => r.id))));
  const answerBySq = new Map(answers.map((a) => [a.subquestionId, a]));

  let allAnswered = true;
  let reachedAt: Date | null = null;
  for (const r of visibleReq) {
    const a = answerBySq.get(r.id);
    if (!a || !answerIsFilled(r.kind as SubquestionKind, a)) { allAnswered = false; break; }
    if (reachedAt == null || a.answeredAt > reachedAt) reachedAt = a.answeredAt;
  }

  if (allAnswered && reachedAt) {
    await db.insert(caseMilestones)
      .values({ id: generateId(), caseId, milestoneId, reachedAt, recordedByCollector: null, derived: true })
      .onConflictDoUpdate({
        target: [caseMilestones.caseId, caseMilestones.milestoneId],
        set: { reachedAt, derived: true },
      });
    return true;
  }
  if (existing && existing.derived) await db.delete(caseMilestones).where(eq(caseMilestones.id, existing.id));
  return false;
}

// Implicit closure (0043): completing the FINAL milestone (highest sort_order in
// the study) auto-closes the case; un-completing it reopens — but ONLY if the
// case was auto-closed (closedReason='final_milestone'), never a manual close.
export async function recomputeCaseClosure(caseId: string, studyId: string, applicableIn?: Set<string>): Promise<void> {
  // Dynamic milestones (0051): the "final" milestone is the highest-sortOrder one
  // that APPLIES to this case, not the global last — so a case whose last
  // milestones are scoped out (e.g. additional borrowing) closes on its own last
  // relevant milestone instead of hanging on an irrelevant one.
  const applicable = applicableIn ?? await getApplicableMilestoneIds(caseId, studyId);
  const ms = (await db.select({ id: milestones.id, sortOrder: milestones.sortOrder })
    .from(milestones).where(eq(milestones.studyId, studyId))
    .orderBy(desc(milestones.sortOrder)))
    .filter((m) => applicable.has(m.id));
  const final = ms[0];
  if (!final) return; // no applicable milestones → nothing drives closure

  const caseRow = (await db.select().from(cases).where(eq(cases.id, caseId)))[0];
  if (!caseRow) return;

  const finalDone = (await db.select().from(caseMilestones)
    .where(and(eq(caseMilestones.caseId, caseId), eq(caseMilestones.milestoneId, final.id))))[0];

  if (finalDone && caseRow.status === 'open') {
    await updateCase(caseId, { status: 'closed', closedAt: finalDone.reachedAt, closedReason: 'final_milestone' });
  } else if (!finalDone && caseRow.status === 'closed' && caseRow.closedReason === 'final_milestone') {
    await updateCase(caseId, { status: 'open' });
  }
}

// --- Milestones (2026-06-18) — ordered containers above decision points ---

export async function getMilestones(studyId: string) {
  return db.select().from(milestones).where(eq(milestones.studyId, studyId)).orderBy(asc(milestones.sortOrder));
}

export async function addMilestone(studyId: string, label: string) {
  const id = generateId();
  const existing = await getMilestones(studyId);
  const row = { id, studyId, label, sortOrder: existing.length };
  await db.insert(milestones).values(row);
  return row;
}

export async function updateMilestone(id: string, data: { label?: string; sortOrder?: number }) {
  const updateFields: Record<string, unknown> = {};
  if (data.label !== undefined) updateFields.label = data.label;
  if (data.sortOrder !== undefined) updateFields.sortOrder = data.sortOrder;
  if (Object.keys(updateFields).length > 0) {
    await db.update(milestones).set(updateFields).where(eq(milestones.id, id));
  }
}

// One POST reorders the whole list — set sortOrder = position. Avoids the
// per-row PATCH races a drag-reorder would otherwise create.
export async function reorderMilestones(studyId: string, orderedIds: string[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(milestones).set({ sortOrder: i })
      .where(and(eq(milestones.id, orderedIds[i]), eq(milestones.studyId, studyId)));
  }
}

export async function deleteMilestone(id: string) {
  // decision_point_types.milestone_id is SET NULL (decisions survive, just
  // unassigned); case_milestones rows cascade.
  await db.delete(milestones).where(eq(milestones.id, id));
}

export async function getCaseMilestones(caseId: string) {
  return db.select().from(caseMilestones).where(eq(caseMilestones.caseId, caseId));
}

// ── Milestone demand-type EXCLUSIONS (0056; replaces the 0051 include model) ──
export async function getMilestoneDemandTypeExclusions(studyId: string) {
  return db.select({ id: milestoneDemandTypeExclusions.id, milestoneId: milestoneDemandTypeExclusions.milestoneId, demandTypeId: milestoneDemandTypeExclusions.demandTypeId })
    .from(milestoneDemandTypeExclusions)
    .innerJoin(milestones, eq(milestoneDemandTypeExclusions.milestoneId, milestones.id))
    .where(eq(milestones.studyId, studyId));
}

// Diff-set the demand types a milestone is EXCLUDED for (empty = applies to all).
export async function setMilestoneDemandTypeExclusions(milestoneId: string, demandTypeIds: string[]) {
  const desired = new Set(demandTypeIds);
  const current = await db.select().from(milestoneDemandTypeExclusions).where(eq(milestoneDemandTypeExclusions.milestoneId, milestoneId));
  const currentIds = new Set(current.map((r) => r.demandTypeId));
  for (const r of current) {
    if (!desired.has(r.demandTypeId)) await db.delete(milestoneDemandTypeExclusions).where(eq(milestoneDemandTypeExclusions.id, r.id));
  }
  for (const dtId of demandTypeIds) {
    if (currentIds.has(dtId)) continue;
    await db.insert(milestoneDemandTypeExclusions).values({ id: generateId(), milestoneId, demandTypeId: dtId });
  }
}

// ── Per-subquestion demand-type exclusions (0054) ────────────────────────────
// Diff-set the demand types a subquestion is EXCLUDED for (empty = applies to all).
export async function setSubquestionDemandTypeExclusions(subquestionId: string, demandTypeIds: string[]) {
  const desired = new Set(demandTypeIds);
  const current = await db.select().from(subquestionDemandTypeExclusions).where(eq(subquestionDemandTypeExclusions.subquestionId, subquestionId));
  const currentIds = new Set(current.map((r) => r.demandTypeId));
  for (const r of current) {
    if (!desired.has(r.demandTypeId)) await db.delete(subquestionDemandTypeExclusions).where(eq(subquestionDemandTypeExclusions.id, r.id));
  }
  for (const dtId of demandTypeIds) {
    if (currentIds.has(dtId)) continue;
    await db.insert(subquestionDemandTypeExclusions).values({ id: generateId(), subquestionId, demandTypeId: dtId });
  }
}

// Subquestion ids EXCLUDED for a case, i.e. whose exclusion set intersects the
// case's demand types. These are hidden in capture and never gate completion.
export async function getCaseExcludedSubquestionIds(caseId: string, studyId: string): Promise<Set<string>> {
  const caseDT = new Set(await getCaseDemandTypeIds(caseId));
  if (caseDT.size === 0) return new Set();
  const rows = await db.select({ subquestionId: subquestionDemandTypeExclusions.subquestionId, demandTypeId: subquestionDemandTypeExclusions.demandTypeId })
    .from(subquestionDemandTypeExclusions)
    .innerJoin(subquestions, eq(subquestionDemandTypeExclusions.subquestionId, subquestions.id))
    .innerJoin(milestones, eq(subquestions.milestoneId, milestones.id))
    .where(eq(milestones.studyId, studyId));
  const excluded = new Set<string>();
  for (const r of rows) if (caseDT.has(r.demandTypeId)) excluded.add(r.subquestionId);
  return excluded;
}

// Diff-set the demand types a subquestion is NOT MANDATORY for (0055; empty = normal).
export async function setSubquestionDemandTypeOptional(subquestionId: string, demandTypeIds: string[]) {
  const desired = new Set(demandTypeIds);
  const current = await db.select().from(subquestionDemandTypeOptional).where(eq(subquestionDemandTypeOptional.subquestionId, subquestionId));
  const currentIds = new Set(current.map((r) => r.demandTypeId));
  for (const r of current) {
    if (!desired.has(r.demandTypeId)) await db.delete(subquestionDemandTypeOptional).where(eq(subquestionDemandTypeOptional.id, r.id));
  }
  for (const dtId of demandTypeIds) {
    if (currentIds.has(dtId)) continue;
    await db.insert(subquestionDemandTypeOptional).values({ id: generateId(), subquestionId, demandTypeId: dtId });
  }
}

// Subquestion ids NOT MANDATORY for a case (0055): still shown, but dropped from
// completion gating when their optional set intersects the case's demand types.
export async function getCaseOptionalSubquestionIds(caseId: string, studyId: string): Promise<Set<string>> {
  const caseDT = new Set(await getCaseDemandTypeIds(caseId));
  if (caseDT.size === 0) return new Set();
  const rows = await db.select({ subquestionId: subquestionDemandTypeOptional.subquestionId, demandTypeId: subquestionDemandTypeOptional.demandTypeId })
    .from(subquestionDemandTypeOptional)
    .innerJoin(subquestions, eq(subquestionDemandTypeOptional.subquestionId, subquestions.id))
    .innerJoin(milestones, eq(subquestions.milestoneId, milestones.id))
    .where(eq(milestones.studyId, studyId));
  const optional = new Set<string>();
  for (const r of rows) if (caseDT.has(r.demandTypeId)) optional.add(r.subquestionId);
  return optional;
}

// Milestones that APPLY to a case (0056 exclude model): a milestone applies
// unless its exclusion set intersects the case's demand types. No rows = applies
// to all. Optional precomputed `caseDemandTypeIds` avoids a re-query in the save loop.
export async function getApplicableMilestoneIds(caseId: string, studyId: string, caseDemandTypeIds?: string[]): Promise<Set<string>> {
  const ms = await getMilestones(studyId);
  const excls = await getMilestoneDemandTypeExclusions(studyId);
  const caseDT = new Set(caseDemandTypeIds ?? await getCaseDemandTypeIds(caseId));
  const byMs = new Map<string, string[]>();
  for (const c of excls) { const l = byMs.get(c.milestoneId) ?? []; l.push(c.demandTypeId); byMs.set(c.milestoneId, l); }
  const applies = new Set<string>();
  for (const m of ms) {
    const dts = byMs.get(m.id) ?? [];
    if (!dts.some((id) => caseDT.has(id))) applies.add(m.id);
  }
  return applies;
}

// --- Capability-chart annotations (2026-06-18) — exclude/note per measure ---

export async function getCapabilityAnnotations(studyId: string, fromEvent: string, toEvent: string) {
  return db.select().from(capabilityAnnotations)
    .where(and(
      eq(capabilityAnnotations.studyId, studyId),
      eq(capabilityAnnotations.fromEvent, fromEvent),
      eq(capabilityAnnotations.toEvent, toEvent),
    ));
}

// Upsert on (caseId, fromEvent, toEvent) — only set the fields provided.
export async function upsertCapabilityAnnotation(studyId: string, data: {
  caseId: string;
  fromEvent: string;
  toEvent: string;
  excluded?: boolean;
  excludedReason?: string | null;
  note?: string | null;
}) {
  const set: Record<string, unknown> = {};
  if (data.excluded !== undefined) set.excluded = data.excluded;
  if (data.excludedReason !== undefined) set.excludedReason = data.excludedReason;
  if (data.note !== undefined) set.note = data.note;
  await db.insert(capabilityAnnotations).values({
    id: generateId(),
    studyId,
    caseId: data.caseId,
    fromEvent: data.fromEvent,
    toEvent: data.toEvent,
    excluded: data.excluded ?? false,
    excludedReason: data.excludedReason ?? null,
    note: data.note ?? null,
  }).onConflictDoUpdate({
    target: [capabilityAnnotations.caseId, capabilityAnnotations.fromEvent, capabilityAnnotations.toEvent],
    set,
  });
}

export async function getEntries(studyId: string, from?: Date, to?: Date) {
  const conditions = [eq(demandEntries.studyId, studyId)];
  if (from) conditions.push(gte(demandEntries.createdAt, from));
  if (to) conditions.push(lte(demandEntries.createdAt, to));

  return db.select().from(demandEntries)
    .where(and(...conditions))
    .orderBy(desc(demandEntries.createdAt));
}

export async function getEntryInStudy(studyId: string, entryId: string) {
  const rows = await db.select().from(demandEntries)
    .where(and(eq(demandEntries.id, entryId), eq(demandEntries.studyId, studyId)))
    .limit(1);
  return rows[0];
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
  workBlocks?: { tag: 'value' | 'sequence' | 'failure' | 'failure_demand'; text: string; workStepTypeId?: string | null; systemConditionId?: string | null; systemConditionIds?: string[]; demandTypeId?: string | null; valueStepId?: string | null; date?: string | null }[];
  // Case stitching (Skipton slice 1): re-attach or detach an entry from a case.
  caseId?: string | null;
  // C7 (2026-06-17): did the customer feel this touch?
  customerFelt?: boolean | null;
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
  if (data.caseId !== undefined) updateFields.caseId = data.caseId;
  if (data.customerFelt !== undefined) updateFields.customerFelt = data.customerFelt;
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
    if (whatMattersTypeIds.length > 0) {
      await db.insert(demandEntryWhatMatters).values(
        whatMattersTypeIds.map((wmtId) => ({ id: generateId(), demandEntryId: entryId, whatMattersTypeId: wmtId })),
      );
    }
  }

  // Update system condition junction records if provided. Carries per-pair dimension + 5 field attachments.
  if (systemConditions !== undefined) {
    await db.delete(demandEntrySystemConditions).where(eq(demandEntrySystemConditions.demandEntryId, entryId));
    if (systemConditions.length > 0) {
      await db.insert(demandEntrySystemConditions).values(
        systemConditions.map((sc) => {
          const anyAttachment = sc.attachesToLifeProblem || sc.attachesToDemand || sc.attachesToWhatMatters || sc.attachesToCor || sc.attachesToWork;
          return {
            id: generateId(),
            demandEntryId: entryId,
            systemConditionId: sc.id,
            dimension: sc.dimension || 'hinders',
            attachesToLifeProblem: !!sc.attachesToLifeProblem,
            attachesToDemand:      anyAttachment ? !!sc.attachesToDemand : true,
            attachesToWhatMatters: !!sc.attachesToWhatMatters,
            attachesToCor:         !!sc.attachesToCor,
            attachesToWork:        !!sc.attachesToWork,
          };
        }),
      );
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
    const thRows = thinkings.map((th) => ({
      id: generateId(),
      demandEntryId: entryId,
      thinkingId: th.id,
      logic: th.logic || '',
      dimension: (th.dimension === 'helps' ? 'helps' : 'hinders') as 'helps' | 'hinders',
    }));
    const thScRows = thinkings.flatMap((th) =>
      (th.scAttachments || [])
        .filter((att) => scIdsOnEntry.has(att.systemConditionId))
        .map((att) => ({ id: generateId(), demandEntryId: entryId, thinkingId: th.id, systemConditionId: att.systemConditionId })),
    );
    if (thRows.length > 0) await db.insert(demandEntryThinkings).values(thRows);
    if (thScRows.length > 0) await db.insert(demandEntryThinkingScs).values(thScRows);
  }

  // Replace work-description blocks when provided (Work tab only, Phase 2 / Item 4).
  if (workBlocks !== undefined) {
    await db.delete(workDescriptionBlocks).where(eq(workDescriptionBlocks.demandEntryId, entryId));
    const blockRows: (typeof workDescriptionBlocks.$inferInsert)[] = [];
    const blockScRows: (typeof workBlockSystemConditions.$inferInsert)[] = [];
    let order = 0;
    for (const block of workBlocks) {
      const scIds = [...new Set(block.systemConditionIds ?? (block.systemConditionId ? [block.systemConditionId] : []))];
      const blockId = generateId();
      blockRows.push({
        id: blockId,
        demandEntryId: entryId,
        tag: block.tag,
        text: block.text,
        sortOrder: order++,
        workStepTypeId: block.workStepTypeId ?? null,
        systemConditionId: scIds[0] ?? null,
        blockDate: block.date ? new Date(block.date) : null,
        // Per-block failure-demand type (0033): only 'failure demand' steps carry one.
        demandTypeId: block.tag === 'failure_demand' ? (block.demandTypeId ?? null) : null,
        valueStepId: block.valueStepId ?? null,
      });
      for (const scId of scIds) {
        blockScRows.push({ id: generateId(), workBlockId: blockId, systemConditionId: scId });
      }
    }
    if (blockRows.length > 0) await db.insert(workDescriptionBlocks).values(blockRows);
    if (blockScRows.length > 0) await db.insert(workBlockSystemConditions).values(blockScRows);
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

// All SC ids per block (0032 junction), for repopulating the multi-select on edit.
export async function getBlockSystemConditions(blockIds: string[]) {
  if (blockIds.length === 0) return [] as { workBlockId: string; systemConditionId: string }[];
  return db.select({ workBlockId: workBlockSystemConditions.workBlockId, systemConditionId: workBlockSystemConditions.systemConditionId })
    .from(workBlockSystemConditions)
    .where(inArray(workBlockSystemConditions.workBlockId, blockIds));
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
