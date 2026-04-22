'use client';

import { useLocale } from '@/lib/locale-context';

type ToggleField =
  | 'classificationEnabled'
  | 'handlingEnabled'
  | 'valueLinkingEnabled'
  | 'systemConditionsEnabled'
  | 'demandTypesEnabled'
  | 'workTrackingEnabled'
  | 'workTypesEnabled'
  | 'flowDemandEnabled'
  | 'flowWorkEnabled'
  | 'workSourcesEnabled'
  | 'workClassificationEnabled'
  | 'whatMattersEnabled'
  | 'thinkingsEnabled'
  | 'lifeProblemsEnabled';

// Virtual toggle — the UI renders it as a plain on/off row, but it writes to
// studies.workClassificationMode (text enum) rather than a boolean column.
// Keeping it distinct from ToggleField so the optimistic-update callback keeps
// its simple boolean shape.
const SEQUENCE_WORK_VIRTUAL = 'sequenceWorkEnabled' as const;

export interface CaptureTogglesPanelStudy {
  classificationEnabled: boolean;
  handlingEnabled: boolean;
  valueLinkingEnabled: boolean;
  systemConditionsEnabled: boolean;
  demandTypesEnabled: boolean;
  workTrackingEnabled: boolean;
  workTypesEnabled: boolean;
  flowDemandEnabled: boolean;
  flowWorkEnabled: boolean;
  workSourcesEnabled: boolean;
  // Work-tab classification row gate (migration 0017).
  workClassificationEnabled: boolean;
  whatMattersEnabled: boolean;
  thinkingsEnabled: boolean;
  lifeProblemsEnabled: boolean;
  // Work-tab classification preset (migration 0016). Drives the "Capture
  // sequence work" virtual toggle — derived from this, not a column of its own.
  workClassificationMode: 'value-sequence-failure-unknown' | 'value-failure-unknown';
}

type OptimisticField = ToggleField | 'workClassificationMode';
type OptimisticValue = boolean | CaptureTogglesPanelStudy['workClassificationMode'];

interface Props {
  code: string;
  study: CaptureTogglesPanelStudy;
  onChange: () => void | Promise<void>;
  /** When true, the outer card chrome (title, description, rounded border) is rendered. Use false when the parent already provides a heading (e.g. in a modal). */
  showHeader?: boolean;
  /** Optional optimistic update. When provided, the parent updates its local
   *  study state immediately; the PUT fires in the background. On PUT failure
   *  the toggle is reverted. When omitted, the panel falls back to firing PUT
   *  then awaiting onChange() (full refresh) — the pre-perf-pass behaviour.
   *
   *  Covers both the boolean toggle columns AND the non-boolean
   *  `workClassificationMode` enum that the "Capture sequence work" virtual
   *  toggle writes to — the parent just forwards the (field, value) pair
   *  into its local study state, so the type can stay a simple pair. */
  onOptimisticToggle?: (field: OptimisticField, value: OptimisticValue) => void;
}

export default function CaptureTogglesPanel({ code, study, onChange, showHeader = true, onOptimisticToggle }: Props) {
  const { t } = useLocale();

  async function toggleCapture(field: ToggleField, value: boolean) {
    if (onOptimisticToggle) {
      // Optimistic: flip local state immediately, PUT in background, revert on error.
      onOptimisticToggle(field, value);
      try {
        const res = await fetch(`/api/studies/${encodeURIComponent(code)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        });
        if (!res.ok) onOptimisticToggle(field, !value);
      } catch {
        onOptimisticToggle(field, !value);
      }
      return;
    }
    // Fallback: PUT then full refresh.
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    await onChange();
  }

  // Sequence-work virtual toggle — maps the on/off UI onto the
  // workClassificationMode text enum on the server. Uses the same optimistic
  // path as the boolean toggles so the checkbox flips instantly.
  async function toggleSequenceWork(value: boolean) {
    const mode: CaptureTogglesPanelStudy['workClassificationMode'] = value
      ? 'value-sequence-failure-unknown'
      : 'value-failure-unknown';
    if (onOptimisticToggle) {
      onOptimisticToggle('workClassificationMode', mode);
      try {
        const res = await fetch(`/api/studies/${encodeURIComponent(code)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workClassificationMode: mode }),
        });
        if (!res.ok) {
          // Revert on error.
          onOptimisticToggle('workClassificationMode', value ? 'value-failure-unknown' : 'value-sequence-failure-unknown');
        }
      } catch {
        onOptimisticToggle('workClassificationMode', value ? 'value-failure-unknown' : 'value-sequence-failure-unknown');
      }
      return;
    }
    // Fallback: PUT then full refresh.
    await fetch(`/api/studies/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workClassificationMode: mode }),
    });
    await onChange();
  }

  // Ordered to mirror the learning a typical team goes through: start by separating
  // value from failure demand, then trace failure back to the value it failed to serve,
  // then understand life problems and demand types, then what matters, capability of
  // response, work and work types, and finally system conditions and thinking.
  type Row =
    | { kind: 'toggle'; key: ToggleField; label: string; value: boolean }
    | { kind: 'virtual'; key: typeof SEQUENCE_WORK_VIRTUAL; label: string; value: boolean };

  const rows: Row[] = [
    { kind: 'toggle', key: 'classificationEnabled', label: t('capture.toggles.classification'), value: study.classificationEnabled },
    { kind: 'toggle', key: 'valueLinkingEnabled', label: t('capture.toggles.valueLinking'), value: study.valueLinkingEnabled },
    { kind: 'toggle', key: 'lifeProblemsEnabled', label: t('capture.toggles.lifeProblems'), value: study.lifeProblemsEnabled },
    { kind: 'toggle', key: 'demandTypesEnabled', label: t('capture.toggles.demandTypes'), value: study.demandTypesEnabled },
    { kind: 'toggle', key: 'flowDemandEnabled', label: t('capture.toggles.flowDemand'), value: study.flowDemandEnabled },
    { kind: 'toggle', key: 'whatMattersEnabled', label: t('capture.toggles.whatMatters'), value: study.whatMattersEnabled },
    { kind: 'toggle', key: 'handlingEnabled', label: t('capture.toggles.handling'), value: study.handlingEnabled },
    { kind: 'toggle', key: 'workTrackingEnabled', label: t('capture.toggles.work'), value: study.workTrackingEnabled },
    { kind: 'toggle', key: 'workTypesEnabled', label: t('capture.toggles.workTypes'), value: study.workTypesEnabled },
    // Work-tab classification row gate (on = show Value/Sequence/Failure/? for work).
    { kind: 'toggle', key: 'workClassificationEnabled', label: t('capture.toggles.workClassification'), value: study.workClassificationEnabled },
    // Sequence-work virtual toggle — on = show Sequence pill on Work tab.
    { kind: 'virtual', key: SEQUENCE_WORK_VIRTUAL, label: t('capture.toggles.sequenceWork'), value: study.workClassificationMode === 'value-sequence-failure-unknown' },
    { kind: 'toggle', key: 'flowWorkEnabled', label: t('capture.toggles.flowWork'), value: study.flowWorkEnabled },
    { kind: 'toggle', key: 'workSourcesEnabled', label: t('capture.toggles.workSources'), value: study.workSourcesEnabled },
    { kind: 'toggle', key: 'systemConditionsEnabled', label: t('capture.toggles.systemConditions'), value: study.systemConditionsEnabled },
    { kind: 'toggle', key: 'thinkingsEnabled', label: t('capture.toggles.thinkings'), value: study.thinkingsEnabled },
  ];

  const list = (
    // Pill-shaped toggles. Each pill IS the switch — no separate checkbox.
    // items-start + content-sized pills keeps the column as narrow as its
    // widest label so the capture form behind the modal stays visible.
    <div className="flex flex-col items-start gap-3">
      {rows.map((row) => {
        const on = row.value;
        return (
          <button
            key={row.key}
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => {
              if (row.kind === 'virtual') {
                toggleSequenceWork(!on);
              } else {
                toggleCapture(row.key, !on);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors text-left ${
              on
                ? 'bg-gray-200 text-gray-900 border-gray-400 hover:bg-gray-300'
                : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
            }`}
          >
            {row.label}
          </button>
        );
      })}
    </div>
  );

  if (!showHeader) return list;

  return (
    <div>
      <h2 className="text-base font-semibold mb-1 text-gray-900">{t('capture.toggles.title')}</h2>
      <p className="text-sm text-gray-600 mb-3">{t('capture.toggles.desc')}</p>
      {list}
    </div>
  );
}
