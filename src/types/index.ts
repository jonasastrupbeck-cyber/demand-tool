export interface Study {
  id: string;
  accessCode: string;
  name: string;
  description: string;
  oneStopHandlingType: string | null;
  primaryContactMethodId: string | null;
  createdAt: Date;
  isActive: boolean;
}

export interface HandlingType {
  id: string;
  studyId: string;
  label: string;
  sortOrder: number;
}

export interface DemandType {
  id: string;
  studyId: string;
  category: 'value' | 'failure';
  label: string;
  sortOrder: number;
}

export interface ContactMethod {
  id: string;
  studyId: string;
  label: string;
  sortOrder: number;
}

export interface WhatMattersType {
  id: string;
  studyId: string;
  label: string;
  sortOrder: number;
}

export interface DemandEntry {
  id: string;
  studyId: string;
  createdAt: Date;
  verbatim: string;
  classification: 'value' | 'failure';
  handlingTypeId: string | null;
  demandTypeId: string | null;
  contactMethodId: string | null;
  whatMattersTypeId: string | null;
  originalValueDemandTypeId: string | null;
  failureCause: string | null;
  whatMatters: string | null;
}

export interface DashboardData {
  totalEntries: number;
  valueCount: number;
  failureCount: number;
  perfectPercentage: number;
  demandTypeCounts: Array<{ label: string; category: string; count: number }>;
  handlingTypeCounts: Array<{ label: string; count: number }>;
  contactMethodCounts: Array<{ label: string; count: number }>;
  whatMattersCounts: Array<{ label: string; count: number }>;
  handlingByClassification: Array<{ label: string; valueCount: number; failureCount: number }>;
  demandOverTime: Array<{ date: string; valueCount: number; failureCount: number }>;
  failureCauses: Array<{ cause: string; count: number }>;
  failuresByOriginalValueDemand: Array<{ label: string; count: number }>;
  whatMattersNotes: Array<{ text: string; date: string }>;
}

export interface CreateEntryInput {
  verbatim: string;
  classification: 'value' | 'failure';
  handlingTypeId?: string;
  demandTypeId?: string;
  contactMethodId?: string;
  whatMattersTypeId?: string;
  originalValueDemandTypeId?: string;
  failureCause?: string;
  whatMatters?: string;
}
