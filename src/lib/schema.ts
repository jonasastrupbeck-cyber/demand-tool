import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

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
  volumeMode: boolean('volume_mode').notNull().default(false),
  lifecycleEnabled: boolean('lifecycle_enabled').notNull().default(false),
  activeLayer: integer('active_layer').notNull().default(1),
  classificationEnabled: boolean('classification_enabled').notNull().default(false),
  handlingEnabled: boolean('handling_enabled').notNull().default(false),
  valueLinkingEnabled: boolean('value_linking_enabled').notNull().default(false),
  consultantPin: text('consultant_pin'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export const handlingTypes = pgTable('handling_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  operationalDefinition: text('operational_definition'),
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

export const whatMattersTypes = pgTable('what_matters_types', {
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
  sortOrder: integer('sort_order').notNull().default(0),
  lifecycleStageId: text('lifecycle_stage_id').references(() => lifecycleStages.id),
  lifecycleAiSuggestion: text('lifecycle_ai_suggestion'),
  lifecycleClassifiedAt: timestamp('lifecycle_classified_at', { withTimezone: true }),
});

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
  whatMattersTypeId: text('what_matters_type_id').references(() => whatMattersTypes.id),
  originalValueDemandTypeId: text('original_value_demand_type_id').references(() => demandTypes.id),
  workTypeId: text('work_type_id').references(() => workTypes.id),
  linkedValueDemandEntryId: text('linked_value_demand_entry_id'),
  failureCause: text('failure_cause'),
  whatMatters: text('what_matters'),
  collectorName: text('collector_name'),
  lifecycleStageId: text('lifecycle_stage_id').references(() => lifecycleStages.id),
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
});

export const demandEntrySystemConditions = pgTable('demand_entry_system_conditions', {
  id: text('id').primaryKey(),
  demandEntryId: text('demand_entry_id').notNull().references(() => demandEntries.id, { onDelete: 'cascade' }),
  systemConditionId: text('system_condition_id').notNull().references(() => systemConditions.id),
});

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
});
