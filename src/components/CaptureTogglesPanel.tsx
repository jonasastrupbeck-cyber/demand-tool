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
  | 'whatMattersEnabled'
  | 'thinkingsEnabled'
  | 'lifeProblemsEnabled';

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
  whatMattersEnabled: boolean;
  thinkingsEnabled: boolean;
  lifeProblemsEnabled: boolean;
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

  // Ordered to mirror the learning a typical team goes through: start by separating
  // value from failure demand, then trace failure back to the value it failed to serve,
  // then understand life problems and demand types, then what matters, capability of
  // response, work and work types, and finally system conditions and thinking.
  const rows: Array<{ key: ToggleField; label: string; value: boolean }> = [
    { key: 'classificationEnabled', label: t('capture.toggles.classification'), value: study.classificationEnabled },
    { key: 'valueLinkingEnabled', label: t('capture.toggles.valueLinking'), value: study.valueLinkingEnabled },
    { key: 'lifeProblemsEnabled', label: t('capture.toggles.lifeProblems'), value: study.lifeProblemsEnabled },
    { key: 'demandTypesEnabled', label: t('capture.toggles.demandTypes'), value: study.demandTypesEnabled },
    { key: 'flowDemandEnabled', label: t('capture.toggles.flowDemand'), value: study.flowDemandEnabled },
    { key: 'whatMattersEnabled', label: t('capture.toggles.whatMatters'), value: study.whatMattersEnabled },
    { key: 'handlingEnabled', label: t('capture.toggles.handling'), value: study.handlingEnabled },
    { key: 'workTrackingEnabled', label: t('capture.toggles.work'), value: study.workTrackingEnabled },
    { key: 'workTypesEnabled', label: t('capture.toggles.workTypes'), value: study.workTypesEnabled },
    { key: 'flowWorkEnabled', label: t('capture.toggles.flowWork'), value: study.flowWorkEnabled },
    { key: 'workSourcesEnabled', label: t('capture.toggles.workSources'), value: study.workSourcesEnabled },
    { key: 'systemConditionsEnabled', label: t('capture.toggles.systemConditions'), value: study.systemConditionsEnabled },
    { key: 'thinkingsEnabled', label: t('capture.toggles.thinkings'), value: study.thinkingsEnabled },
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
            onChange={(e) => toggleCapture(row.key, e.target.checked)}
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
