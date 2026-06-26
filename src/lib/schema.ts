import { pgTable, text, integer, boolean, timestamp, unique } from 'drizzle-orm/pg-core';

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
}, (t) => ({
  uniqCaseWm: unique('case_what_matters_unique').on(t.caseId, t.whatMattersTypeId),
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

// Decision points (Skipton dotted box, 2026-06-12). A per-study taxonomy —
// NOT a hardcoded person/property/value enum — so the tool stays generic.
// Each type carries its own outcome wording (Accept/Decline, £ accepted/
// £ disputed, ...). The three mortgage points are seed data per locale.
export const decisionPointTypes = pgTable('decision_point_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  positiveLabel: text('positive_label').notNull(),
  negativeLabel: text('negative_label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  // C9 (2026-06-17): which sub-state template this milestone shows. 'person'
  // adds the Willingness/Ability-to-Pay yes/no sub-states (the affordability
  // gate before an Accept/Decline). Null = standard (outcome + cleanliness only).
  kind: text('kind'),
  // 2026-06-18: the milestone this decision point belongs to. Nullable so a
  // point can be transiently unassigned in Settings; SET NULL on milestone
  // delete (deleting a milestone keeps its decision points, just unassigns
  // them — contrast caseDecisionPoints.decisionPointTypeId which cascades).
  milestoneId: text('milestone_id').references(() => milestones.id, { onDelete: 'set null' }),
});

// One row per decided point per case; pending points simply have no row.
// E2E time per point = decidedAt − cases.openedAt, always computed, never
// stored. Cleanliness is captured HERE and only here (per Skipton req 7:
// per-step dirtiness is too noisy — the decision point is the measure).
// Type-FK cascades deliberately: deleting a decision-point type from
// settings is a consultant taxonomy fix and takes its case records along.
export const caseDecisionPoints = pgTable('case_decision_points', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  decisionPointTypeId: text('decision_point_type_id').notNull().references(() => decisionPointTypes.id, { onDelete: 'cascade' }),
  outcome: text('outcome').$type<'positive' | 'negative'>().notNull(),
  cleanliness: text('cleanliness').$type<'clean' | 'dirty'>().notNull(),
  dirtyCause: text('dirty_cause'),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull(),
  recordedByCollector: text('recorded_by_collector'),
  // C9 (2026-06-17): affordability sub-states captured for 'person'-kind
  // milestones. Nullable — only set when the type asks for them; legacy rows
  // and other decision kinds stay null.
  willingnessToPay: boolean('willingness_to_pay'),
  abilityToPay: boolean('ability_to_pay'),
}, (t) => ({
  // Explicit short name (63-char identifier lesson, see 0019).
  uniqCaseDp: unique('case_decision_points_unique').on(t.caseId, t.decisionPointTypeId),
}));

// One row per achieved/not-achieved milestone per case (2026-06-18). The
// milestone's OWN outcome, recorded explicitly and separately from the
// decisions inside it. A 'not_achieved' outcome halts the journey and closes
// the case (status closed, closedAt = reachedAt); 'achieved' / no row keeps it
// open. reachedAt feeds the later "time between events" capability charts.
// Both FKs cascade: deleting a case or a milestone type drops its records.
export const caseMilestones = pgTable('case_milestones', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  milestoneId: text('milestone_id').notNull().references(() => milestones.id, { onDelete: 'cascade' }),
  outcome: text('outcome').$type<'achieved' | 'not_achieved'>().notNull(),
  reachedAt: timestamp('reached_at', { withTimezone: true }).notNull(),
  recordedByCollector: text('recorded_by_collector'),
}, (t) => ({
  uniqCaseMilestone: unique('case_milestones_unique').on(t.caseId, t.milestoneId),
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
