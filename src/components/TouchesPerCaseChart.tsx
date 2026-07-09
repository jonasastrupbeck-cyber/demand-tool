'use client';

import { useState, useEffect } from 'react';
import type { CapabilityData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import XmRChart from '@/components/XmRChart';
import PillSelect from '@/components/PillSelect';
import InfoPopover from '@/components/InfoPopover';

// Touches-per-case XmR (2026-07-08): one point per case = its total touch count
// (a touch = one saved work entry). Scoped by the dashboard's value-demand filter.
// Picking a value step switches the measure to "touches up to completing that
// step" (touches up to the case's last touch on that step).
export default function TouchesPerCaseChart({
  code, dateFrom, dateTo, valueDemands, valueSteps = [],
}: {
  code: string;
  dateFrom?: string;
  dateTo?: string;
  valueDemands?: string[];
  valueSteps?: { id: string; label: string }[];
}) {
  const { t, tl } = useLocale();
  const [valueStepId, setValueStepId] = useState('');
  const [data, setData] = useState<CapabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  // Bumped after a saved annotation to refetch (server recomputes exclude-aware limits).
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const qp = new URLSearchParams();
    if (dateFrom) qp.set('from', dateFrom);
    if (dateTo) qp.set('to', dateTo);
    if (valueDemands && valueDemands.length) qp.set('valueDemands', valueDemands.join(','));
    if (valueStepId) qp.set('valueStep', valueStepId);
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/touches-per-case?${qp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [code, dateFrom, dateTo, valueDemands, valueStepId, tick]);

  // Annotations are keyed to the base measure (filter-independent), matching the
  // capability chart. count/% + value-step scope share the one chartKey.
  const annotate = {
    onSave: async (pointKey: string, patch: { excluded: boolean; excludedReason: string | null; note: string | null }) => {
      await fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/chart-annotation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartKey: 'touches-per-case', pointKey, ...patch }),
      });
      setTick((n) => n + 1);
    },
  };

  const stepLabel = valueSteps.find((v) => v.id === valueStepId)?.label;
  const subtitle = valueStepId && stepLabel ? t('dashboard.touchesUpToStep', { step: tl(stepLabel) }) : undefined;

  const controls = valueSteps.length > 0 ? (
    <PillSelect
      ariaLabel={t('capture.selectValueStep')}
      placeholder={t('capture.selectValueStep')}
      value={valueStepId}
      onChange={setValueStepId}
      options={[{ id: '', label: t('dashboard.valueStepAll') }, ...valueSteps.map((v) => ({ id: v.id, label: tl(v.label) }))]}
    />
  ) : undefined;

  return (
    <XmRChart
      title={t('dashboard.touchesPerCaseTitle')}
      subtitle={subtitle}
      valueLabel={t('dashboard.touchesPerCase')}
      data={data}
      loading={loading}
      controls={controls}
      info={<InfoPopover label={t('dashboard.touchesPerCaseTitle')}>{t('dashboard.calcTouchesPerCase')}</InfoPopover>}
      annotate={annotate}
    />
  );
}
