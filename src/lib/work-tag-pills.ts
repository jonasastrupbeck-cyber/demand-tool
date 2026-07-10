// Soft-tone selected classes for the Value / SEQ / Failure / Failure-demand
// work-classification pills (2026-07-05). Semantic colour kept (green=value,
// red=failure…), lightened to match the customer-context What-matters pill so
// the work box reads in the same softer pill language. Unselected state is the
// PillToggle default gray. Used by the capture composer + EntryEditModal, in
// both the free-text and picker modes.
// `titleKey` (2026-07-10) = the tag's Vanguard definition, shown as a native hover
// tooltip on the pill (PillToggle passes it straight to the button's `title`).
export const WORK_TAG_PILLS = [
  { value: 'value', labelKey: 'capture.workBlockTagValue', titleKey: 'capture.workBlockTagValueDef', activeClassName: 'bg-green-100 text-green-800 border-green-400' },
  { value: 'sequence', labelKey: 'capture.workBlockTagSequence', titleKey: 'capture.workBlockTagSequenceDef', activeClassName: 'bg-emerald-100 text-emerald-800 border-emerald-400' },
  { value: 'failure', labelKey: 'capture.workBlockTagFailure', titleKey: 'capture.workBlockTagFailureDef', activeClassName: 'bg-red-100 text-red-800 border-red-400' },
  { value: 'failure_demand', labelKey: 'capture.workBlockTagFailureDemand', titleKey: 'capture.workBlockTagFailureDemandDef', activeClassName: 'bg-rose-100 text-rose-800 border-rose-400' },
] as const;
