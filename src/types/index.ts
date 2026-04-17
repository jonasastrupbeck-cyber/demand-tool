export interface Study {
  id: string;
  accessCode: string;
  name: string;
  description: string;
  oneStopHandlingType: string | null;
  primaryContactMethodId: string | null;
  primaryPointOfTransactionId: string | null;
  workTrackingEnabled: boolean;
  systemConditionsEnabled: boolean;
  demandTypesEnabled: boolean;
  workTypesEnabled: boolean;
  // Phase 4 (2026-04-16) — managed Work Step Type taxonomy toggle
  workStepTypesEnabled: boolean;
  volumeMode: boolean;
  activeLayer: number;
  classificationEnabled: boolean;
  handlingEnabled: boolean;
  valueLinkingEnabled: boolean;
  consultantPin: string | null;
  createdAt: Date;
  isActive: boolean;
}

export interface HandlingType {
  id: string;
  studyId: string;
  label: string;
  operationalDefinition: string | null;
  sortOrder: number;
}

export interface DemandType {
  id: string;
  studyId: string;
  category: 'value' | 'failure';
  label: string;
  operationalDefinition: string | null;
  sortOrder: number;
}

export interface ContactMethod {
  id: string;
  studyId: string;
  label: string;
  sortOrder: number;
}

export interface PointOfTransaction {
  id: string;
  studyId: string;
  label: string;
  sortOrder: number;
}

export interface WhatMattersType {
  id: string;
  studyId: string;
  label: string;
  operationalDefinition: string | null;
  sortOrder: number;
}

export interface WorkType {
  id: string;
  studyId: string;
  label: string;
  sortOrder: number;
}

// Phase 4 (2026-04-16) — managed taxonomy for Flow block step descriptions.
// Tag fixed at taxonomy level (same step is always value or always failure).
export interface WorkStepType {
  id: string;
  studyId: string;
  label: string;
  tag: 'value' | 'failure';
  operationalDefinition: string | null;
  sortOrder: number;
}

export interface DemandEntry {
  id: string;
  studyId: string;
  createdAt: Date;
  verbatim: string;
  classification: 'value' | 'failure' | 'unknown' | 'sequence';
  entryType: 'demand' | 'work';
  handlingTypeId: string | null;
  demandTypeId: string | null;
  contactMethodId: string | null;
  pointOfTransactionId: string | null;
  whatMattersTypeId: string | null;
  whatMattersTypeIds: string[];
  systemConditions: { id: string; dimension: 'helps' | 'hinders' }[];
  thinkings: { id: string; logic: string }[];
  originalValueDemandTypeId: string | null;
  workTypeId: string | null;
  linkedValueDemandEntryId: string | null;
  failureCause: string | null;
  whatMatters: string | null;
  collectorName: string | null;
  workBlocks: { tag: 'value' | 'failure'; text: string }[];
}

export interface DashboardData {
  totalEntries: number;
  valueCount: number;
  failureCount: number;
  unknownCount: number;
  perfectPercentage: number;
  demandTypeCounts: Array<{ label: string; category: string; count: number }>;
  handlingTypeCounts: Array<{ label: string; count: number }>;
  contactMethodCounts: Array<{ label: string; count: number }>;
  lifeProblemCounts: Array<{ label: string; count: number }>;
  pointOfTransactionByClassification: Array<{ label: string; valueCount: number; failureCount: number }>;
  whatMattersCounts: Array<{ label: string; count: number }>;
  whatMattersByClassification: Array<{ label: string; valueCount: number; failureCount: number }>;
  handlingByClassification: Array<{ label: string; valueCount: number; failureCount: number }>;
  demandOverTime: Array<{ date: string; valueCount: number; failureCount: number }>;
  failureCauses: Array<{ cause: string; count: number }>;
  helpingConditions: Array<{ cause: string; count: number }>;
  failuresByOriginalValueDemand: Array<{ label: string; count: number }>;
  failureFlowLinks: Array<{ sourceLabel: string; targetLabel: string; count: number }>;
  whatMattersNotes: Array<{ text: string; date: string; demandTypeLabel: string | null; classification: string | null }>;
  collectorCounts: Array<{ name: string; count: number; lastActive: string }>;
  // Work tracking
  workCount: number;
  workValueCount: number;
  workFailureCount: number;
  workUnknownCount: number;
  workTypeCounts: Array<{ label: string; count: number }>;
  workTypesByClassification: Array<{ label: string; valueCount: number; failureCount: number }>;
  workOverTime: Array<{ date: string; valueCount: number; failureCount: number; unknownCount: number }>;
  // Lifecycle
  lifecycleEnabled: boolean;
  lifecycleByStageAndDemandType: Array<{ stageLabel: string; stageSortOrder: number; demandTypeLabel: string; demandTypeCategory: 'value' | 'failure'; count: number }>;
  lifecycleFailureByStage: Array<{ stageLabel: string; stageSortOrder: number; count: number }>;
}

export interface CreateEntryInput {
  verbatim: string;
  classification: 'value' | 'failure' | 'unknown' | 'sequence';
  entryType?: 'demand' | 'work';
  handlingTypeId?: string;
  demandTypeId?: string;
  contactMethodId?: string;
  pointOfTransactionId?: string;
  whatMattersTypeId?: string;
  whatMattersTypeIds?: string[];
  systemConditions?: { id: string; dimension: 'helps' | 'hinders' }[];
  thinkings?: { id: string; logic: string }[];
  originalValueDemandTypeId?: string;
  workTypeId?: string;
  linkedValueDemandEntryId?: string;
  failureCause?: string;
  whatMatters?: string;
  collectorName?: string;
  workBlocks?: { tag: 'value' | 'failure'; text: string }[];
}

export interface DemandEntryWhatMatters {
  id: string;
  demandEntryId: string;
  whatMattersTypeId: string;
}

export interface SystemCondition {
  id: string;
  studyId: string;
  label: string;
  operationalDefinition: string | null;
  sortOrder: number;
}

export interface DemandEntrySystemCondition {
  id: string;
  demandEntryId: string;
  systemConditionId: string;
}

export interface Thinking {
  id: string;
  studyId: string;
  label: string;
  operationalDefinition: string | null;
  sortOrder: number;
}

export interface DemandEntryThinking {
  id: string;
  demandEntryId: string;
  thinkingId: string;
}

export interface WorkDescriptionBlock {
  id: string;
  demandEntryId: string;
  tag: 'value' | 'failure';
  text: string;
  sortOrder: number;
  // Phase 4 (2026-04-16) — optional managed-step reference.
  // Null = free-text block (current behaviour); non-null = picker choice.
  workStepTypeId: string | null;
}
