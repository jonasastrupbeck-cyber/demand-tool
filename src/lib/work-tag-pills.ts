// Soft-tone selected classes for the Value / SEQ / Failure / Failure-demand
// work-classification pills (2026-07-05). Semantic colour kept (green=value,
// red=failure…), lightened to match the customer-context What-matters pill so
// the work box reads in the same softer pill language. Unselected state is the
// PillToggle default gray. Used by the capture composer + EntryEditModal, in
// both the free-text and picker modes.
export const WORK_TAG_PILLS = [
  { value: 'value', labelKey: 'capture.workBlockTagValue', activeClassName: 'bg-green-100 text-green-800 border-green-400' },
  { value: 'sequence', labelKey: 'capture.workBlockTagSequence', activeClassName: 'bg-emerald-100 text-emerald-800 border-emerald-400' },
  { value: 'failure', labelKey: 'capture.workBlockTagFailure', activeClassName: 'bg-red-100 text-red-800 border-red-400' },
  { value: 'failure_demand', labelKey: 'capture.workBlockTagFailureDemand', activeClassName: 'bg-rose-100 text-rose-800 border-rose-400' },
] as const;
