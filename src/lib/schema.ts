import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const studies = pgTable('studies', {
  id: text('id').primaryKey(),
  accessCode: text('access_code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').default(''),
  oneStopHandlingType: text('one_stop_handling_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export const handlingTypes = pgTable('handling_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const demandTypes = pgTable('demand_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  category: text('category').$type<'value' | 'failure'>().notNull(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const contactMethods = pgTable('contact_methods', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const whatMattersTypes = pgTable('what_matters_types', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const demandEntries = pgTable('demand_entries', {
  id: text('id').primaryKey(),
  studyId: text('study_id').notNull().references(() => studies.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  verbatim: text('verbatim').notNull(),
  classification: text('classification').$type<'value' | 'failure'>().notNull(),
  handlingTypeId: text('handling_type_id').references(() => handlingTypes.id),
  demandTypeId: text('demand_type_id').references(() => demandTypes.id),
  contactMethodId: text('contact_method_id').references(() => contactMethods.id),
  whatMattersTypeId: text('what_matters_type_id').references(() => whatMattersTypes.id),
  failureCause: text('failure_cause'),
  whatMatters: text('what_matters'),
});
