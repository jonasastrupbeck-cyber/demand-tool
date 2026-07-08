'use client';

import { useState, useEffect } from 'react';
import type { CapabilityData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import XmRChart from '@/components/XmRChart';

// Touches-per-case XmR (2026-07-08): one point per case = its total touch count
// (a touch = one saved work entry). Scoped by the dashboard's value-demand filter.
export default function TouchesPerCaseChart({
  code, dateFrom, dateTo, valueDemands,
}: {
  code: string;
  dateFrom?: string;
  dateTo?: string;
  valueDemands?: string[];
}) {
  const { t } = useLocale();
  const [data, setData] = useState<CapabilityData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const qp = new URLSearchParams();
    if (dateFrom) qp.set('from', dateFrom);
    if (dateTo) qp.set('to', dateTo);
    if (valueDemands && valueDemands.length) qp.set('valueDemands', valueDemands.join(','));
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/touches-per-case?${qp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [code, dateFrom, dateTo, valueDemands]);

  return (
    <XmRChart
      title={t('dashboard.touchesPerCaseTitle')}
      valueLabel={t('dashboard.touchesPerCase')}
      data={data}
      loading={loading}
    />
  );
}
