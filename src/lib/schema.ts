import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const studies = sqliteTable('studies', {
  id: text('id').primaryKey(),
  accessCode: text('access_code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').default(''),
  oneStopHandlingType: text('one_stop_handling_type'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const handlingTypes = sqliteTable('handling_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const demandTypes = sqliteTable('demand_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  category: text('category', { enum: ['value', 'failure'] }).notNull(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const contactMethods = sqliteTable('contact_methods', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const whatMattersTypes = sqliteTable('what_matters_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const demandEntries = sqliteTable('demand_entries', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  verbatim: text('verbatim').notNull(),
  classification: text('classification', { enum: ['value', 'failure'] }).notNull(),
  handlingTypeId: text('handling_type_id').references(() => handlingTypes.id),
  demandTypeId: text('demand_type_id').references(() => demandTypes.id),
  contactMethodId: text('contact_method_id').references(() => contactMethods.id),
  whatMattersTypeId: text('what_matters_type_id').references(() => whatMattersTypes.id),
  failureCause: text('failure_cause'),
  whatMatters: text('what_matters'),
});
