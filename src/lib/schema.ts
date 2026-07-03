import { pgTable, text, integer, boolean, timestamp, unique, doublePrecision } from 'drizzle-orm/pg-core';

export const studies = pgTable('studies', {
  id: text('id').primaryKey(),
  accessCode: text('access_code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').default(''),
  purpose: text('purpose').default(''),
  oneStopHandlingType: text('one_stop_handling_type'),
  primaryContactMethodId: text('primary_contact_method_id'),
  primaryPointOfTransactionId: text('primary_point_of_transaction_id'),
  workTrackingEnabled: boolean('work_tracking_enabled').notNull().default(false),
  systemConditionsEnabled: boolean('system_conditions_enabled').notNull().default(false),
  demandTypesEnabled: boolean('demand_types_enabled').notNull().default(false),
  workTypesEnabled: boolean('work_types_enabled').notNull().default(false),
  // Phase 4 (2026-04-16): managed taxonomy for Flow step descriptions. When
  // true, Flow blocks can pick from the study's `workStepTypes` list; free-text
  // fallback stays available per-block.
  workStepTypesEnabled: boolean('work_step_types_enabled').notNull().default(false),
  // Flow = value work + waste. Opt-in per entry-type so teams can capture Flow
  // on demand entries, work entries, both, or neither (2026-04-22).
  flowDemandEnabled: boolean('flow_demand_enabled').notNull().default(false),
  flowWorkEnabled: boolean('flow_work_enabled').notNull().default(false),
  // Work sources — opt-in taxonomy: "Where did the work come from?"
  // Renders as a session-sticky pill on the Work tab only (migration 0015).
  workSourcesEnabled: boolean('work_sources_enabled').notNull().default(false),
  // Work-tab classification preset (migration 0016). Chooses which pills appear
  // on the Value / Sequence / Failure / ? row for work captures:
  //   'value-sequence-failure-unknown' (default) — all four
  //   'value-failure-unknown'                    — drops the Sequence pill
  // Demand tab is unaffected; it keeps Value / Failure / ? always.
  workClassificationMode: text('work_classification_mode')
    .$type<'value-sequence-failure-unknown' | 'value-failure-unknown'>()
    .notNull()
    .default('value-sequence-failure-unknown'),
  // Independent gate for the whole Work-tab classification row (migration 0017).
  // When false, work entries save without asking for a value/failure/? choice;
  // classification defaults to 'unknown' server-side. Demand tab is unaffected.
  workClassificationEnabled: boolean('work_classification_enabled').notNull().default(true),
  volumeMode: boolean('volume_mode').notNull().default(false),
  lifecycleEnabled: boolean('lifecycle_enabled').notNull().default(false),
  activeLayer: integer('active_layer').notNull().default(1),
  classificationEnabled: boolean('classification_enabled').notNull().default(false),
  handlingEnabled: boolean('handling_enabled').notNull().default(false),
  valueLinkingEnabled: boolean('value_linking_enabled').notNull().default(false),
  // Iterative-build toggles (migration 0013). Default false so new studies start
  // minimal; existing studies were backfilled from their implicit behaviour.
  whatMattersEnabled: boolean('what_matters_enabled').notNull().default(false),
  thinkingsEnabled: boolean('thinkings_enabled').notNull().default(false),
  lifeProblemsEnabled: boolean('life_problems_enabled').notNull().default(false),
  // Case stitching (Skipton slice 1, 2026-06-11). When true, the capture form
  // shows a Case ref input: one privacy-safe reference number = one customer =
  // one value demand, letting multiple collectors append entries to the same
  // case across time and handoffs. See docs/ and the Skipton requirements note.
  caseTrackingEnabled: boolean('case_tracking_enabled').notNull().default(false),
  // System type (2026-06-11): the LAYOUT REGIME, not a strand toggle — follows
  // the workClassificationMode text-enum precedent. 'transactional' = today's
  // interface (atomic entries, entry-level person context). 'flow' = case-first:
  // person context (context & situation, P2BS, what matters) lives on the case
  // and touches are lean. The 17 strand toggles stay individually tunable in
  // both regimes; choosing 'flow' applies a one-time ADDITIVE preset and the
  // server forces caseTrackingEnabled=true (flow is meaningless without cases).
  systemType: text('system_type')
    .$type<'transactional' | 'flow'>()
    .notNull()
    .default('transactional'),
  // C5 (2026-06-17): which flow layout to render. 'stacked' = today's mobile-
  // first vertical flow (Skipton's live field test stays here). 'freeze' = the
  // wide-screen freeze-pane (frozen customer pane left, scrolling touch rail,
  // frozen decision-milestone pane right). Only meaningful when systemType='flow'.
  flowLayout: text('flow_layout')
    .$type<'stacked' | 'freeze'>()
    .notNull()
    .default('stacked'),
  // Decision points (Skipton dotted box, 2026-06-12): per-case end-to-end
  // decision capture — outcome + clean/dirty + date. Default false; part of
  // the flow preset.
  decisionPointsEnabled: boolean('decision_points_enabled').notNull().default(false),
  // Synthesis (2026-06-24): toggle-gates the "Synthesise system conditions"
  // surface — study the captured-condition distribution, then merge/rename the
  // sames+similars in place (the change cascades to every linked record).
  // Default false; only meaningful alongside systemConditionsEnabled.
  synthesisEnabled: boolean('synthesis_enabled').notNull().default(false),
  // Flow analytics (migration 0029, 2026-06-24): opt-in "Analytics" tab on the
  // flow dashboard surfacing the demand-style measures (already computed by
  // getDashboardData) for flow studies. Default false.
  flowAnalyticsEnabled: boolean('flow_analytics_enabled').notNull().default(false),
  // Flow failure-demand types (migration 0033, 2026-06-26): opt-in per-block
  // "Type of failure demand" picker on failure-tagged flow work blocks, so a
  // step can record what kind of failure demand hit at that point. Default
  // false so transactional / non-flow capture is unchanged.
  flowFailureDemandTypesEnabled: boolean('flow_failure_demand_types_enabled').notNull().default(false),
  // Value steps (migration 0047, 2026-07-03): opt-in per-block "What value step
  // is this work related to?" picker on flow work blocks. Default false.
  valueStepsEnabled: boolean('value_steps_enabled').notNull().default(false),
  consultantPin: text('consultant_pin'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export const handlingTypes = pgTable('handling_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  operationalDefinition: text('operational_definition'),
  // C7 (2026-06-17): is this Capability of Response felt by the customer
  // (customer-facing) vs an internal/partner handoff? Drives the default of
  // demandEntries.customerFelt and the "touches from the customer's POV" metric.
  customerFacing: boolean('customer_facing').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const lifecycleStages = pgTable('lifecycle_stages', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  code: text('code').notNull(), // 'attract', 'acquire', 'live_with', 'look_after', 'grow_keep', 'help_me_leave', 'custom'
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const demandTypes = pgTable('demand_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  category: text('category').$type<'value' | 'failure'>().notNull(),
  label: text('label').notNull(),
  operationalDefinition: text('operational_definition'),
  sortOrder: integer('sort_order').notNull().default(0),
  lifecycleStageId: text('lifecycle_stage_id').references(() => lifecycleStages.id),
  lifecycleAiSuggestion: text('lifecycle_ai_suggestion'),
  lifecycleClassifiedAt: timestamp('lifecycle_classified_at', { withTimezone: true }),
});

export const contactMethods = pgTable('contact_methods', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const pointsOfTransaction = pgTable('points_of_transaction', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  customerFacing: boolean('customer_facing').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

// Work sources — "Where did the work come from?". Mirrors pointsOfTransaction
// but applies only to work captures (migration 0015, 2026-04-22).
export const workSources = pgTable('work_sources', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  customerFacing: boolean('customer_facing').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const whatMattersTypes = pgTable('what_matters_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  operationalDefinition: text('operational_definition'),
  sortOrder: integer('sort_order').notNull().default(0),
  // Time-based "what matters" (2026-07-01). null = ordinary free-form factor.
  // 'by_date' = customer wants it by a specific date (captured per case in
  // caseWhatMatters.targetDate); 'asap' = no date, clock runs from case open.
  timing: text('timing').$type<'by_date' | 'asap'>(),
  // Anchor for the 'asap' type: ASAP is measured as case open → this event
  // reached. A capability event TOKEN — 'milestone:<id>' OR 'decision:<typeId>'
  // — so it can be either a milestone or a decision point (2026-07-01). Set once
  // per study in Settings; a deleted target just resolves to no data.
  // `anchorMilestoneId` is the earlier milestone-only column, now superseded by
  // `anchorEvent` (left in place, additive; not read anymore).
  anchorMilestoneId: text('anchor_milestone_id'),
  anchorEvent: text('anchor_event'),
  // 2026-07-02: per-type capture toggle. false hides the pill from NEW capture
  // selection only — cases that already selected it keep their data, and
  // dashboards read junction rows, not this flag.
  enabled: boolean('enabled').notNull().default(true),
  // Structured ask (2026-07-02). null = plain pill. 'amount' = a specific
  // amount OR a lower/upper range ("Meet my budget"). 'date_or_duration' = an
  // end date OR years+months ("I want my mortgage term to be…"). Only on
  // non-timed types — the two standard timed types keep timing semantics.
  valueKind: text('value_kind').$type<'amount' | 'date_or_duration'>(),
});

export const lifeProblems = pgTable('life_problems', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  operationalDefinition: text('operational_definition'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const workTypes = pgTable('work_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  // 2026-04-29: a work type is intrinsically value, failure, or sequence —
  // mirrors workStepTypes.tag. Capture filters the dropdown by this field.
  category: text('category').$type<'value' | 'failure' | 'sequence'>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  lifecycleStageId: text('lifecycle_stage_id').references(() => lifecycleStages.id),
  lifecycleAiSuggestion: text('lifecycle_ai_suggestion'),
  lifecycleClassifiedAt: timestamp('lifecycle_classified_at', { withTimezone: true }),
  // Synthesis soft-archive (migration 0030) — see systemConditions.
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  mergedIntoId: text('merged_into_id'),
});

// Phase 4 (2026-04-16) — managed taxonomy for Flow block step descriptions.
// Different granularity from workTypes: workTypes classifies the whole work
// entry, workStepTypes classifies each step in the Flow. Tag is fixed at
// the taxonomy level (per Jonas: value vs failure is fundamental, same step
// is always the same side).
export const workStepTypes = pgTable('work_step_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  // 'sequence' added 2026-04-23 — mirrors the free-text work-block tag
  // widening on 2026-04-22 (see work_description_blocks.tag below). No DB
  // migration needed since `tag` is TEXT.
  tag: text('tag').$type<'value' | 'sequence' | 'failure'>().notNull(),
  operationalDefinition: text('operational_definition'),
  sortOrder: integer('sort_order').notNull().default(0),
  // Synthesis soft-archive (migration 0030) — see systemConditions.
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  mergedIntoId: text('merged_into_id'),
});

// Value steps (migration 0047, 2026-07-03): a study-level, editable, ORDERED
// list of the customer value-journey stages (e.g. the mortgage flow's
// Willingness to Pay … 1st Direct Debit). Each flow work block tags ONE value
// step, so the dashboard can show where failure/sequence work most appears.
export const valueSteps = pgTable('value_steps', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

// Generic audit log for single-FK taxonomy merges (migration 0030): work types
// and work step types (and any future single-FK taxonomy). `taxonomy` is the
// discriminator; `moved` is a JSON array of {id, from} for the re-pointed link
// rows so a merge can be undone. (System conditions keep their own richer
// systemConditionMerges table because of the junction + helps/hinders dedupe.)
export const taxonomyMerges = pgTable('taxonomy_merges', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  taxonomy: text('taxonomy').notNull().$type<'work_type' | 'work_step_type'>(),
  targetId: text('target_id').notNull(),
  sourceIds: text('source_ids').notNull(),
  moved: text('moved').notNull(),
  priorTargetLabel: text('prior_target_label'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

// Case stitching (Skipton slice 1, 2026-06-11). A case is a CONTAINER: each
// pickup/handoff stays an ordinary demandEntry (own createdAt, collectorName,
// handlingTypeId, flow blocks) attached via demandEntries.caseId. The case
// timeline ordered by createdAt IS the repeatable Capability-of-Response
// sequence — no separate COR table needed. caseRef is a privacy-safe number
// only, never customer data. openedAt starts the end-to-end clock (editable:
// a case may predate its first capture). Decision points come in a later slice.
export const cases = pgTable('cases', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  caseRef: text('case_ref').notNull(),
  // The "big flow" this case belongs to (e.g. Help me buy / Remortgage).
  demandTypeId: text('demand_type_id').references(() => demandTypes.id),
  status: text('status').$type<'open' | 'closed'>().notNull().default('open'),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  // 0043: why the case is closed — 'final_milestone' (auto, from completing the
  // last milestone) vs 'manual' (an explicit human close). recomputeCaseClosure
  // only reopens a case it closed itself ('final_milestone'), never a manual one.
  closedReason: text('closed_reason').$type<'final_milestone' | 'manual'>(),
  note: text('note'),
  createdByCollector: text('created_by_collector'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  // Flow-mode person context (slice B, 2026-06-11). In a flow-based system the
  // context belongs to the CASE (per Ali's wireframe: Account Ref / Context &
  // Situation / P2BS / What Matters), not to each touch. Entry-level fields
  // stay for transactional studies.
  contextSituation: text('context_situation'),
  lifeProblemId: text('life_problem_id').references(() => lifeProblems.id),
  // Free-text note alongside the caseWhatMatters junction — intentional
  // duplication mirroring demandEntries.whatMatters vs demandEntryWhatMatters
  // (categories + a nuance note are different data; don't "clean up").
  whatMatters: text('what_matters'),
}, (t) => ({
  uniqStudyCaseRef: unique().on(t.studyId, t.caseRef),
}));

// Case-level what-matters multi-select (flow mode). Mirrors
// demandEntryWhatMatters exactly, one level up.
export const caseWhatMatters = pgTable('case_what_matters', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  whatMattersTypeId: text('what_matters_type_id').notNull().references(() => whatMattersTypes.id),
  // Customer's wanted date, only for a 'by_date' what-matters type (2026-07-01).
  // Also the "date" half of a valueKind='date_or_duration' ask (2026-07-02).
  targetDate: timestamp('target_date', { withTimezone: true }),
  // Structured ask values (2026-07-02), per the type's valueKind. Exactly one
  // shape is populated per row — the setter always writes ALL of these columns
  // from a full-object patch, so switching specific↔range or date↔duration
  // atomically nulls the abandoned shape.
  amountSpecific: doublePrecision('amount_specific'),
  amountMin: doublePrecision('amount_min'),
  amountMax: doublePrecision('amount_max'),
  termYears: integer('term_years'),
  termMonths: integer('term_months'),
}, (t) => ({
  uniqCaseWm: unique('case_what_matters_unique').on(t.caseId, t.whatMattersTypeId),
}));

// Case-level multi-select for life problems (P2BS) and value demands (2026-07-02).
// A case can carry several of each. The single cases.lifeProblemId /
// cases.demandTypeId columns stay as the "primary" (first-selected, earliest by
// row id) so dashboards + CSV export keep working unchanged; these junctions
// hold the full set the flow capture green box shows. Mirror caseWhatMatters.
export const caseLifeProblems = pgTable('case_life_problems', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  lifeProblemId: text('life_problem_id').notNull().references(() => lifeProblems.id),
}, (t) => ({
  uniqCaseLp: unique('case_life_problems_unique').on(t.caseId, t.lifeProblemId),
}));

export const caseDemandTypes = pgTable('case_demand_types', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  demandTypeId: text('demand_type_id').notNull().references(() => demandTypes.id),
}, (t) => ({
  uniqCaseDt: unique('case_demand_types_unique').on(t.caseId, t.demandTypeId),
}));

// Milestones (2026-06-18). An ordered container layer ABOVE decision points:
// a mortgage journey runs through milestones (e.g. milestone 1 wraps the
// person/property/value decisions; later ones lead to "completion / funds
// paid out"). Milestones run chronologically; each carries its OWN per-case
// outcome (see caseMilestones) separate from the decisions inside it. Backfill
// 0026 gives every existing study one "Milestone 1" wrapping its decisions.
export const milestones = pgTable('milestones', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

// One row per COMPLETED milestone per case. Completion is derived (0042): a row
// exists once every required subquestion is answered (see recomputeCaseMilestone);
// reachedAt is the latest of those answers and feeds the capability charts.
// `derived` marks a helper-owned row vs a frozen legacy completion. Both FKs
// cascade: deleting a case or a milestone type drops its records.
export const caseMilestones = pgTable('case_milestones', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  milestoneId: text('milestone_id').notNull().references(() => milestones.id, { onDelete: 'cascade' }),
  reachedAt: timestamp('reached_at', { withTimezone: true }).notNull(),
  recordedByCollector: text('recorded_by_collector'),
  // 0042 (decision-box redesign): milestone completion is now DERIVED from
  // subquestion answers (see recomputeCaseMilestone). derived=true rows are
  // owned by that helper and rewritten/deleted as answers change; derived=false
  // rows are frozen legacy/manual completions the helper must never touch.
  derived: boolean('derived').notNull().default(false),
}, (t) => ({
  uniqCaseMilestone: unique('case_milestones_unique').on(t.caseId, t.milestoneId),
}));

// ── Decision-box redesign (0042, 2026-07-02) ─────────────────────────────────
// The decision-point layer is flattened away: consultants define SUBQUESTIONS
// directly under a milestone. A subquestion is a typed box (amount | number |
// date | duration | text | choice); choice options can carry positive/negative
// polarity (an "outcome"). A subquestion may link to a what-matters type so
// filling it both records AND evaluates the delivered value (see ask-verdict).
export const subquestions = pgTable('subquestions', {
  id: text('id').primaryKey(),
  milestoneId: text('milestone_id').notNull().references(() => milestones.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  kind: text('kind').$type<'amount' | 'number' | 'date' | 'duration' | 'text' | 'choice'>().notNull(),
  // Milestone completion = every REQUIRED subquestion answered.
  required: boolean('required').notNull().default(true),
  linkedWhatMattersTypeId: text('linked_what_matters_type_id').references(() => whatMattersTypes.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  // Provenance for the 0042 backfill (raw field id, or 'outcome:'/'willingness:'
  // /'ability:' + decision-point id). Null for subquestions created after.
  migratedFromFieldId: text('migrated_from_field_id'),
});

// Options for a choice subquestion. polarity null = a plain choice; 'negative'
// prompts the collector to close the case (never auto-closes).
export const subquestionOptions = pgTable('subquestion_options', {
  id: text('id').primaryKey(),
  subquestionId: text('subquestion_id').notNull().references(() => subquestions.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  polarity: text('polarity').$type<'positive' | 'negative'>(),
  sortOrder: integer('sort_order').notNull().default(0),
});

// One row per (case, subquestion). The value lives in the column matching the
// subquestion's kind (amount/number → valueNumber, date → valueDate, duration →
// valueYears+valueMonths, choice → valueChoice, text → valueText). answeredAt is
// frozen at first answer — it drives the milestone completion date.
export const caseSubquestionAnswers = pgTable('case_subquestion_answers', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  subquestionId: text('subquestion_id').notNull().references(() => subquestions.id, { onDelete: 'cascade' }),
  valueNumber: doublePrecision('value_number'),
  valueDate: timestamp('value_date', { withTimezone: true }),
  valueYears: integer('value_years'),
  valueMonths: integer('value_months'),
  valueChoice: text('value_choice'),
  valueText: text('value_text'),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull(),
  recordedByCollector: text('recorded_by_collector'),
}, (t) => ({
  uniqCaseAns: unique('case_subquestion_answers_unique').on(t.caseId, t.subquestionId),
}));

// Capability-chart annotations (2026-06-18). A case is a datapoint on the
// capability/lead-time chart; per the reference capability-tool, a point can be
// EXCLUDED from the control-limit calc (with a reason) or carry a NOTE. Scoped
// to the MEASURE — the (fromEvent, toEvent) pair — so excluding an outlier on
// one chart doesn't affect another. fromEvent/toEvent are the same string tokens
// the capability API uses (caseOpen | firstContact | caseClose | decision:<id> |
// milestone:<id>). Cascades on case delete.
export const capabilityAnnotations = pgTable('capability_annotations', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  fromEvent: text('from_event').notNull(),
  toEvent: text('to_event').notNull(),
  excluded: boolean('excluded').notNull().default(false),
  excludedReason: text('excluded_reason'),
  note: text('note'),
}, (t) => ({
  uniqCapAnno: unique('capability_annotations_unique').on(t.caseId, t.fromEvent, t.toEvent),
}));

export const demandEntries = pgTable('demand_entries', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  verbatim: text('verbatim').notNull(),
  classification: text('classification').$type<'value' | 'failure' | 'unknown' | 'sequence'>().notNull(),
  entryType: text('entry_type').$type<'demand' | 'work'>().notNull().default('demand'),
  handlingTypeId: text('handling_type_id').references(() => handlingTypes.id),
  demandTypeId: text('demand_type_id').references(() => demandTypes.id),
  contactMethodId: text('contact_method_id').references(() => contactMethods.id),
  pointOfTransactionId: text('point_of_transaction_id').references(() => pointsOfTransaction.id),
  workSourceId: text('work_source_id').references(() => workSources.id),
  whatMattersTypeId: text('what_matters_type_id').references(() => whatMattersTypes.id),
  lifeProblemId: text('life_problem_id').references(() => lifeProblems.id),
  originalValueDemandTypeId: text('original_value_demand_type_id').references(() => demandTypes.id),
  workTypeId: text('work_type_id').references(() => workTypes.id),
  // 2026-04-29: free-form work-type text used when classification is '?' (unknown).
  // Mutually exclusive with workTypeId by intent: a "?" capture has no managed
  // type to attach to.
  workTypeFreeText: text('work_type_free_text'),
  linkedValueDemandEntryId: text('linked_value_demand_entry_id'),
  failureCause: text('failure_cause'),
  whatMatters: text('what_matters'),
  collectorName: text('collector_name'),
  lifecycleStageId: text('lifecycle_stage_id').references(() => lifecycleStages.id),
  // Case stitching (Skipton slice 1, 2026-06-11): which case this touch belongs
  // to. Null for all entries in studies without caseTrackingEnabled.
  caseId: text('case_id').references(() => cases.id),
  // C7 (2026-06-17): did the customer feel this touch (customer-facing) vs an
  // internal/partner handoff? Defaults from the chosen COR's customerFacing but
  // is overridable per touch. Null = not asked / legacy entries.
  customerFelt: boolean('customer_felt'),
  // Drag-reorder position within a case's flow timeline (migration 0034, 2026-06-26).
  // NULL = never reordered → the timeline falls back to created_at order. Set for
  // every entry in a case once the user drags to reorder its touches.
  sortOrder: integer('sort_order'),
});

export const demandEntryWhatMatters = pgTable('demand_entry_what_matters', {
  id: text('id').primaryKey(),
  demandEntryId: text('demand_entry_id').notNull().references(() => demandEntries.id, { onDelete: 'cascade' }),
  whatMattersTypeId: text('what_matters_type_id').notNull().references(() => whatMattersTypes.id),
});

export const systemConditions = pgTable('system_conditions', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  operationalDefinition: text('operational_definition'),
  sortOrder: integer('sort_order').notNull().default(0),
  // Synthesis soft-archive (migration 0028, 2026-06-24). When a condition is
  // merged into another, it's archived (not deleted): it disappears from
  // capture pickers + charts but stays traceable. merged_into_id records the
  // surviving condition it folded into. Both null for a live condition.
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  mergedIntoId: text('merged_into_id'),
});

// One row per synthesis merge (migration 0028). Records exactly which junction
// and work-block rows were re-pointed so undoSystemConditionMerge can replay it
// in reverse. The id arrays + source_ids are JSON-encoded text. priorTargetLabel
// restores a rename of the surviving condition on undo.
export const systemConditionMerges = pgTable('system_condition_merges', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  targetId: text('target_id').notNull().references(() => systemConditions.id),
  sourceIds: text('source_ids').notNull(),
  movedJunctionIds: text('moved_junction_ids').notNull(),
  movedBlockIds: text('moved_block_ids').notNull(),
  movedThinkingScs: text('moved_thinking_scs').notNull().default('[]'),
  // Junction-based block-SC moves (migration 0032). Legacy movedBlockIds kept
  // for pre-0032 merge records; new merges record block moves here.
  movedBlockScs: text('moved_block_scs').notNull().default('[]'),
  priorTargetLabel: text('prior_target_label'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const demandEntrySystemConditions = pgTable('demand_entry_system_conditions', {
  id: text('id').primaryKey(),
  demandEntryId: text('demand_entry_id').notNull().references(() => demandEntries.id, { onDelete: 'cascade' }),
  systemConditionId: text('system_condition_id').notNull().references(() => systemConditions.id),
  dimension: text('dimension').notNull().default('hinders').$type<'helps' | 'hinders'>(),
  // Per Ali feedback 2026-04-16: each SC attachment tags which of the five
  // captured fields it helps or hinders. At least one should be true.
  attachesToLifeProblem: boolean('attaches_to_life_problem').notNull().default(false),
  attachesToDemand:      boolean('attaches_to_demand').notNull().default(false),
  attachesToWhatMatters: boolean('attaches_to_what_matters').notNull().default(false),
  attachesToCor:         boolean('attaches_to_cor').notNull().default(false),
  attachesToWork:        boolean('attaches_to_work').notNull().default(false),
}, (t) => ({
  // Explicit short name (2026-06-11): see demand_entry_thinking_scs_unique note.
  uniqEntrySc: unique('demand_entry_system_conditions_unique').on(t.demandEntryId, t.systemConditionId),
}));

export const thinkings = pgTable('thinkings', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  operationalDefinition: text('operational_definition'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const demandEntryThinkings = pgTable('demand_entry_thinkings', {
  id: text('id').primaryKey(),
  demandEntryId: text('demand_entry_id').notNull().references(() => demandEntries.id, { onDelete: 'cascade' }),
  thinkingId: text('thinking_id').notNull().references(() => thinkings.id),
  logic: text('logic').notNull().default(''),
  // Per-thinking-instance helps/hinders, added in migration 0012.
  dimension: text('dimension').$type<'helps' | 'hinders'>().notNull().default('hinders'),
}, (t) => ({
  uniqEntryThinking: unique().on(t.demandEntryId, t.thinkingId),
}));

// Per-entry thinking↔SC attachments. Each thinking on an entry can attach to zero
// or more SCs on the same entry. The helps/hinders dimension lives on the thinking
// row itself (see demandEntryThinkings.dimension), not on the attachment, so this
// junction is just a link.
export const demandEntryThinkingScs = pgTable('demand_entry_thinking_scs', {
  id: text('id').primaryKey(),
  demandEntryId: text('demand_entry_id').notNull().references(() => demandEntries.id, { onDelete: 'cascade' }),
  thinkingId: text('thinking_id').notNull().references(() => thinkings.id),
  systemConditionId: text('system_condition_id').notNull().references(() => systemConditions.id),
}, (t) => ({
  // Explicit short name (2026-06-11): the auto-generated name exceeds Postgres's
  // 63-char identifier limit, which made drizzle-kit push re-prompt forever.
  uniqEntryThinkingSc: unique('demand_entry_thinking_scs_unique').on(t.demandEntryId, t.thinkingId, t.systemConditionId),
}));

export const workDescriptionBlocks = pgTable('work_description_blocks', {
  id: text('id').primaryKey(),
  demandEntryId: text('demand_entry_id').notNull().references(() => demandEntries.id, { onDelete: 'cascade' }),
  // 'sequence' added 2026-04-22 — value-in-orientation work done at the wrong
  // time or in the wrong way. 'failure_demand' added 2026-06-26 (migration 0033) —
  // the step IS a failure demand hitting you (a demand), distinct from 'failure'
  // (= failure WORK done in response). No DB migration needed since tag is TEXT.
  tag: text('tag').$type<'value' | 'sequence' | 'failure' | 'failure_demand'>().notNull(),
  text: text('text').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  // Phase 4 (2026-04-16): optional reference to a managed Work Step Type.
  // ON DELETE SET NULL means deleting a step reverts the block to free-text
  // (text + tag are preserved, no data loss).
  workStepTypeId: text('work_step_type_id').references(() => workStepTypes.id, { onDelete: 'set null' }),
  // Per-block system condition (2026-06-12): in flow mode each failure/sequence
  // work block asks "which system condition is driving this?" — anchored to the
  // block, not the entry. One SC per block; nullable (value blocks + all older
  // rows have none). SET NULL mirrors workStepTypeId: deleting an SC keeps the
  // block's tag/text.
  systemConditionId: text('system_condition_id').references(() => systemConditions.id, { onDelete: 'set null' }),
  // Per-block date (migration 0031, 2026-06-26): a step's own date, for
  // backfilling a missed step. NULL = inherit the entry's createdAt (existing
  // rows + normal capture). Over-time charts bucket by COALESCE(blockDate, entry.createdAt).
  blockDate: timestamp('block_date', { withTimezone: true }),
  // Per-block failure-demand type (migration 0033, 2026-06-26): single FK to a
  // demand_types row (category='failure') for a flow work block tagged
  // 'failure' — what kind of failure demand hit at this step. NULL for
  // value/sequence blocks and all older rows. SET NULL mirrors workStepTypeId.
  demandTypeId: text('demand_type_id').references(() => demandTypes.id, { onDelete: 'set null' }),
  // Value step (migration 0047, 2026-07-03): ONE value step this work relates to.
  // NULL when unset / value_steps disabled. SET NULL mirrors workStepTypeId.
  valueStepId: text('value_step_id').references(() => valueSteps.id, { onDelete: 'set null' }),
});

// Block ↔ system-condition junction (migration 0032): a flow work block can be
// driven by several system conditions. Mirrors demand_entry_system_conditions.
// Supersedes work_description_blocks.system_condition_id (kept, now unread).
export const workBlockSystemConditions = pgTable('work_block_system_conditions', {
  id: text('id').primaryKey(),
  workBlockId: text('work_block_id').notNull().references(() => workDescriptionBlocks.id, { onDelete: 'cascade' }),
  systemConditionId: text('system_condition_id').notNull().references(() => systemConditions.id),
}, (t) => ({
  uniqBlockSc: unique('work_block_system_conditions_unique').on(t.workBlockId, t.systemConditionId),
}));
