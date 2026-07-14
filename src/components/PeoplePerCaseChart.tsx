'use client';

import { useState, useEffect } from 'react';
import type { CapabilityData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import XmRChart from '@/components/XmRChart';
import InfoPopover from '@/components/InfoPopover';

// People-per-value-demand XmR (2026-07-14): one point per case (= one value
// demand) = the number of distinct people who worked on it. Counts distinct
// COALESCE(workedByName, collectorName) over the case's touches — a hand-offs /
// economies-of-flow measure. Scoped by the dashboard's value-demand + status
// filters. No over-time chart (like touches/steps).
export default function PeoplePerCaseChart({
  code, dateFrom, dateTo, valueDemands, status,
}: {
  code: string;
  dateFrom?: string;
  dateTo?: string;
  valueDemands?: string[];
  status?: 'all' | 'open' | 'closed';
}) {
  const { t } = useLocale();
  const [data, setData] = useState<CapabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const qp = new URLSearchParams();
    if (dateFrom) qp.set('from', dateFrom);
    if (dateTo) qp.set('to', dateTo);
    if (valueDemands && valueDemands.length) qp.set('valueDemands', valueDemands.join(','));
    if (status && status !== 'all') qp.set('status', status);
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/people-per-case?${qp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [code, dateFrom, dateTo, valueDemands, status, tick]);

  const annotate = {
    onSave: async (pointKey: string, patch: { excluded: boolean; excludedReason: string | null; note: string | null }) => {
      await fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/chart-annotation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartKey: 'people-per-case', pointKey, ...patch }),
      });
      setTick((n) => n + 1);
    },
  };

  return (
    <XmRChart
      title={t('dashboard.peoplePerValueDemandTitle')}
      valueLabel={t('dashboard.peoplePerValueDemand')}
      nLabel={t('dashboard.valueDemandsN')}
      data={data}
      loading={loading}
      info={<InfoPopover label={t('dashboard.peoplePerValueDemandTitle')}>{t('dashboard.calcPeoplePerValueDemand')}</InfoPopover>}
      annotate={annotate}
    />
  );
}
