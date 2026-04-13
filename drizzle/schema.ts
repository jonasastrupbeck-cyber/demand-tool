import { pgTable, foreignKey, text, integer, timestamp, unique, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const contactMethods = pgTable("contact_methods", {
	id: text().primaryKey().notNull(),
	studyId: text("study_id").notNull(),
	label: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studyId],
			foreignColumns: [studies.id],
			name: "contact_methods_study_id_studies_id_fk"
		}),
]);

export const handlingTypes = pgTable("handling_types", {
	id: text().primaryKey().notNull(),
	studyId: text("study_id").notNull(),
	label: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	operationalDefinition: text("operational_definition"),
}, (table) => [
	foreignKey({
			columns: [table.studyId],
			foreignColumns: [studies.id],
			name: "handling_types_study_id_studies_id_fk"
		}),
]);

export const demandTypes = pgTable("demand_types", {
	id: text().primaryKey().notNull(),
	studyId: text("study_id").notNull(),
	category: text().notNull(),
	label: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	operationalDefinition: text("operational_definition"),
}, (table) => [
	foreignKey({
			columns: [table.studyId],
			foreignColumns: [studies.id],
			name: "demand_types_study_id_studies_id_fk"
		}),
]);

export const whatMattersTypes = pgTable("what_matters_types", {
	id: text().primaryKey().notNull(),
	studyId: text("study_id").notNull(),
	label: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	operationalDefinition: text("operational_definition"),
}, (table) => [
	foreignKey({
			columns: [table.studyId],
			foreignColumns: [studies.id],
			name: "what_matters_types_study_id_studies_id_fk"
		}),
]);

export const demandEntries = pgTable("demand_entries", {
	id: text().primaryKey().notNull(),
	studyId: text("study_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	verbatim: text().notNull(),
	classification: text().notNull(),
	handlingTypeId: text("handling_type_id"),
	demandTypeId: text("demand_type_id"),
	contactMethodId: text("contact_method_id"),
	whatMattersTypeId: text("what_matters_type_id"),
	failureCause: text("failure_cause"),
	whatMatters: text("what_matters"),
	originalValueDemandTypeId: text("original_value_demand_type_id"),
	pointOfTransactionId: text("point_of_transaction_id"),
	collectorName: text("collector_name"),
	entryType: text("entry_type").default('demand').notNull(),
	workTypeId: text("work_type_id"),
	linkedValueDemandEntryId: text("linked_value_demand_entry_id"),
}, (table) => [
	foreignKey({
			columns: [table.studyId],
			foreignColumns: [studies.id],
			name: "demand_entries_study_id_studies_id_fk"
		}),
	foreignKey({
			columns: [table.handlingTypeId],
			foreignColumns: [handlingTypes.id],
			name: "demand_entries_handling_type_id_handling_types_id_fk"
		}),
	foreignKey({
			columns: [table.demandTypeId],
			foreignColumns: [demandTypes.id],
			name: "demand_entries_demand_type_id_demand_types_id_fk"
		}),
	foreignKey({
			columns: [table.contactMethodId],
			foreignColumns: [contactMethods.id],
			name: "demand_entries_contact_method_id_contact_methods_id_fk"
		}),
	foreignKey({
			columns: [table.whatMattersTypeId],
			foreignColumns: [whatMattersTypes.id],
			name: "demand_entries_what_matters_type_id_what_matters_types_id_fk"
		}),
	foreignKey({
			columns: [table.originalValueDemandTypeId],
			foreignColumns: [demandTypes.id],
			name: "demand_entries_original_value_demand_type_id_demand_types_id_fk"
		}),
	foreignKey({
			columns: [table.workTypeId],
			foreignColumns: [workTypes.id],
			name: "demand_entries_work_type_id_work_types_id_fk"
		}),
	foreignKey({
			columns: [table.pointOfTransactionId],
			foreignColumns: [pointsOfTransaction.id],
			name: "demand_entries_point_of_transaction_id_points_of_transaction_id"
		}),
]);

export const studies = pgTable("studies", {
	id: text().primaryKey().notNull(),
	accessCode: text("access_code").notNull(),
	name: text().notNull(),
	description: text().default('),
	oneStopHandlingType: text("one_stop_handling_type"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	primaryContactMethodId: text("primary_contact_method_id"),
	primaryPointOfTransactionId: text("primary_point_of_transaction_id"),
	workTrackingEnabled: boolean("work_tracking_enabled").default(false).notNull(),
	activeLayer: integer("active_layer").default(1).notNull(),
	consultantPin: text("consultant_pin"),
	purpose: text().default('),
}, (table) => [
	unique("studies_access_code_unique").on(table.accessCode),
]);

export const pointsOfTransaction = pgTable("points_of_transaction", {
	id: text().primaryKey().notNull(),
	studyId: text("study_id").notNull(),
	label: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studyId],
			foreignColumns: [studies.id],
			name: "points_of_transaction_study_id_studies_id_fk"
		}),
]);

export const workTypes = pgTable("work_types", {
	id: text().primaryKey().notNull(),
	studyId: text("study_id").notNull(),
	label: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studyId],
			foreignColumns: [studies.id],
			name: "work_types_study_id_studies_id_fk"
		}),
]);

export const demandEntryWhatMatters = pgTable("demand_entry_what_matters", {
	id: text().primaryKey().notNull(),
	demandEntryId: text("demand_entry_id").notNull(),
	whatMattersTypeId: text("what_matters_type_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.demandEntryId],
			foreignColumns: [demandEntries.id],
			name: "demand_entry_what_matters_demand_entry_id_demand_entries_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.whatMattersTypeId],
			foreignColumns: [whatMattersTypes.id],
			name: "demand_entry_what_matters_what_matters_type_id_what_matters_typ"
		}),
]);
