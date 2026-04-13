import { relations } from "drizzle-orm/relations";
import { studies, contactMethods, handlingTypes, demandTypes, whatMattersTypes, demandEntries, workTypes, pointsOfTransaction, demandEntryWhatMatters } from "./schema";

export const contactMethodsRelations = relations(contactMethods, ({one, many}) => ({
	study: one(studies, {
		fields: [contactMethods.studyId],
		references: [studies.id]
	}),
	demandEntries: many(demandEntries),
}));

export const studiesRelations = relations(studies, ({many}) => ({
	contactMethods: many(contactMethods),
	handlingTypes: many(handlingTypes),
	demandTypes: many(demandTypes),
	whatMattersTypes: many(whatMattersTypes),
	demandEntries: many(demandEntries),
	pointsOfTransactions: many(pointsOfTransaction),
	workTypes: many(workTypes),
}));

export const handlingTypesRelations = relations(handlingTypes, ({one, many}) => ({
	study: one(studies, {
		fields: [handlingTypes.studyId],
		references: [studies.id]
	}),
	demandEntries: many(demandEntries),
}));

export const demandTypesRelations = relations(demandTypes, ({one, many}) => ({
	study: one(studies, {
		fields: [demandTypes.studyId],
		references: [studies.id]
	}),
	demandEntries_demandTypeId: many(demandEntries, {
		relationName: "demandEntries_demandTypeId_demandTypes_id"
	}),
	demandEntries_originalValueDemandTypeId: many(demandEntries, {
		relationName: "demandEntries_originalValueDemandTypeId_demandTypes_id"
	}),
}));

export const whatMattersTypesRelations = relations(whatMattersTypes, ({one, many}) => ({
	study: one(studies, {
		fields: [whatMattersTypes.studyId],
		references: [studies.id]
	}),
	demandEntries: many(demandEntries),
	demandEntryWhatMatters: many(demandEntryWhatMatters),
}));

export const demandEntriesRelations = relations(demandEntries, ({one, many}) => ({
	study: one(studies, {
		fields: [demandEntries.studyId],
		references: [studies.id]
	}),
	handlingType: one(handlingTypes, {
		fields: [demandEntries.handlingTypeId],
		references: [handlingTypes.id]
	}),
	demandType_demandTypeId: one(demandTypes, {
		fields: [demandEntries.demandTypeId],
		references: [demandTypes.id],
		relationName: "demandEntries_demandTypeId_demandTypes_id"
	}),
	contactMethod: one(contactMethods, {
		fields: [demandEntries.contactMethodId],
		references: [contactMethods.id]
	}),
	whatMattersType: one(whatMattersTypes, {
		fields: [demandEntries.whatMattersTypeId],
		references: [whatMattersTypes.id]
	}),
	demandType_originalValueDemandTypeId: one(demandTypes, {
		fields: [demandEntries.originalValueDemandTypeId],
		references: [demandTypes.id],
		relationName: "demandEntries_originalValueDemandTypeId_demandTypes_id"
	}),
	workType: one(workTypes, {
		fields: [demandEntries.workTypeId],
		references: [workTypes.id]
	}),
	pointsOfTransaction: one(pointsOfTransaction, {
		fields: [demandEntries.pointOfTransactionId],
		references: [pointsOfTransaction.id]
	}),
	demandEntryWhatMatters: many(demandEntryWhatMatters),
}));

export const workTypesRelations = relations(workTypes, ({one, many}) => ({
	demandEntries: many(demandEntries),
	study: one(studies, {
		fields: [workTypes.studyId],
		references: [studies.id]
	}),
}));

export const pointsOfTransactionRelations = relations(pointsOfTransaction, ({one, many}) => ({
	demandEntries: many(demandEntries),
	study: one(studies, {
		fields: [pointsOfTransaction.studyId],
		references: [studies.id]
	}),
}));

export const demandEntryWhatMattersRelations = relations(demandEntryWhatMatters, ({one}) => ({
	demandEntry: one(demandEntries, {
		fields: [demandEntryWhatMatters.demandEntryId],
		references: [demandEntries.id]
	}),
	whatMattersType: one(whatMattersTypes, {
		fields: [demandEntryWhatMatters.whatMattersTypeId],
		references: [whatMattersTypes.id]
	}),
}));