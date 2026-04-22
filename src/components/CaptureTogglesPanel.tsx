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

interface Props {
  code: string;
  study: CaptureTogglesPanelStudy;
  onChange: () => void | Promise<void>;
  /** When true, the outer card chrome (title, description, rounded border) is rendered. Use false when the parent already provides a heading (e.g. in a modal). */
  showHeader?: boolean;
  /** Optional optimistic update. When provided, the parent updates its local
   *  study state immediately; the PUT fires in the background. On PUT failure
   *  the toggle is reverted. When omitted, the panel falls back to firing PUT
   *  then awaiting onChange() (full refresh) — the pre-perf-pass behaviour. */
  onOptimisticToggle?: (field: ToggleField, value: boolean) => void;
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
  // workClassificationMode text enum on the server. We bypass the generic
  // optimistic path because the field key doesn't match the schema column.
  async function toggleSequenceWork(value: boolean) {
    const mode = value ? 'value-sequence-failure-unknown' : 'value-failure-unknown';
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
    <div className="space-y-2">
      {rows.map((row) => (
        <label
          key={row.key}
          className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer"
        >
          <span className="text-sm text-gray-700">{row.label}</span>
          <input
            type="checkbox"
            checked={row.value}
            onChange={(e) => {
              if (row.kind === 'virtual') {
                toggleSequenceWork(e.target.checked);
              } else {
                toggleCapture(row.key, e.target.checked);
              }
            }}
            className="h-4 w-4 accent-[#ac2c2d]"
          />
        </label>
      ))}
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
