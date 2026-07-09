'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/lib/locale-context';
import type { CapabilityData } from '@/types';
import XmRChart from '@/components/XmRChart';
import InfoPopover from '@/components/InfoPopover';
import PillMultiSelect from '@/components/PillMultiSelect';
import PillSelect from '@/components/PillSelect';
import PillToggle from '@/components/PillToggle';

type Series = '' | 'value' | 'sequence' | 'failure' | 'failure_demand' | 'sc';
type Row = { date: string; count: number; scopeTotal: number };
type ScFreq = { id: string; label: string; count: number };

// XmR (individuals) limits over a time-ordered series — same math as the shared
// server-side xmrLimits (mean ± 2.66 × mean moving range, lower limit floored at
// 0: counts/% can't go negative). Client-side because the plotted values switch
// with the Count/% mode without a refetch.
function xmr(values: number[]) {
  const n = values.length;
  const round1 = (x: number) => Math.round(x * 10) / 10;
  const mean = n ? values.reduce((s, v) => s + v, 0) / n : null;
  const sorted = [...values].sort((a, b) => a - b);
  const median = n ? (n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2) : null;
  let unpl: number | null = null;
  let lnpl: number | null = null;
  if (n >= 2 && mean !== null) {
    let mrSum = 0;
    for (let i = 1; i < values.length; i++) mrSum += Math.abs(values[i] - values[i - 1]);
    const mrBar = mrSum / (values.length - 1);
    unpl = mean + 2.66 * mrBar;
    lnpl = Math.max(0, mean - 2.66 * mrBar);
  }
  return {
    mean: mean !== null ? round1(mean) : null,
    median: median !== null ? round1(median) : null,
    unpl: unpl !== null ? round1(unpl) : null,
    lnpl: lnpl !== null ? round1(lnpl) : null,
  };
}

// Over-time explorer (2026-07-09): build ONE deliberately-chosen over-time series
// — a work classification or a specific system condition — within a chosen scope
// (value demand(s) → value step(s)), rendered as an XmR control chart like the
// Capability-tab charts (one point per DAY; centre line + UNPL/LNPL; special-
// cause days red). % = count ÷ the scope's total blocks per day (server-supplied
// scopeTotal), so a scoped chart never lies about its base. Deliberately
// INDEPENDENT of the dashboard's value-demand filter (Jonas 2026-07-09) — this
// card's own pickers are its single source of truth; only the global period
// applies. Stackable: one series per card, add more cards to compare.
export default function OverTimeExplorerChart({
  code, dateFrom, dateTo, valueDemandOptions, valueStepOptions, onRemove,
}: {
  code: string;
  dateFrom?: string;
  dateTo?: string;
  valueDemandOptions: { id: string; label: string }[];
  valueStepOptions: { id: string; label: string }[];
  onRemove?: () => void;
}) {
  const { t, tl } = useLocale();
  const [valueDemands, setValueDemands] = useState<string[]>([]);
  const [valueStepIds, setValueStepIds] = useState<string[]>([]);
  const [series, setSeries] = useState<Series>('');
  const [scId, setScId] = useState('');
  const [scOptions, setScOptions] = useState<ScFreq[] | null>(null);
  const [mode, setMode] = useState<'count' | 'pct'>('count');
  const [rows, setRows] = useState<Row[] | null>(null);

  // SC picker options: the study's system conditions with occurrence counts,
  // sorted largest-first (the ranking IS the picker). Re-ranked when this
  // card's own value-demand scope changes.
  useEffect(() => {
    if (series !== 'sc') return;
    const qp = new URLSearchParams();
    if (valueDemands.length) qp.set('valueDemands', valueDemands.join(','));
    let cancelled = false;
    fetch(`/api/studies/${encodeURIComponent(code)}/system-conditions/frequencies?${qp}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (!cancelled) setScOptions(Array.isArray(d) ? d : []); });
    return () => { cancelled = true; };
  }, [series, code, valueDemands]);

  // The chart data: fetched once the series selection is complete.
  const seriesParam = series === 'sc' ? (scId ? `sc:${scId}` : '') : series ? `tag:${series}` : '';
  useEffect(() => {
    if (!seriesParam) { setRows(null); return; }
    const qp = new URLSearchParams({ series: seriesParam });
    if (dateFrom) qp.set('from', dateFrom);
    if (dateTo) qp.set('to', dateTo);
    if (valueDemands.length) qp.set('valueDemands', valueDemands.join(','));
    if (valueStepIds.length) qp.set('valueSteps', valueStepIds.join(','));
    let cancelled = false;
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/over-time-series?${qp}`)
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => { if (!cancelled) setRows(d.rows ?? []); });
    return () => { cancelled = true; };
  }, [seriesParam, code, dateFrom, dateTo, valueDemands, valueStepIds]);

  const seriesOptions = [
    { value: 'value', label: t('capture.value') },
    { value: 'sequence', label: t('capture.classificationWorkSequence') },
    { value: 'failure', label: t('capture.failure') },
    { value: 'failure_demand', label: t('dashboard.failureDemand') },
    { value: 'sc', label: t('dashboard.otSeriesSc') },
  ];
  const scLabel = scId ? tl(scOptions?.find((o) => o.id === scId)?.label ?? '') : '';
  const seriesName = series === 'sc' ? scLabel : series ? seriesOptions.find((o) => o.value === series)!.label : '';
  const valueLabel = mode === 'pct' ? `${seriesName} %` : seriesName;
  const fmtValue = (v: number | null) => (v == null ? '—' : mode === 'pct' ? `${v}%` : `${v}`);

  // One XmR point per DAY. Limits from the plotted values (count or % within
  // scope); special-cause = outside the limits, mirroring getCapabilityData.
  let capData: CapabilityData | null = null;
  if (rows && rows.length > 0) {
    const values = rows.map((r) => (mode === 'pct' ? (r.scopeTotal > 0 ? Math.round((r.count / r.scopeTotal) * 100) : 0) : r.count));
    const { mean, median, unpl, lnpl } = xmr(values);
    capData = {
      unit: mode === 'pct' ? '%' : 'steps',
      points: rows.map((r, i) => ({
        caseId: r.date,
        caseRef: r.date,
        leadTime: values[i],
        startedAt: r.date,
        special: unpl !== null && lnpl !== null && (values[i] > unpl || values[i] < lnpl),
        excluded: false,
        note: null,
      })),
      mean, median, unpl, lnpl,
      n: rows.length,
      nExcluded: 0,
      nWantedByDate: 0,
    };
  }

  const controls = (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 px-0.5">{t('dashboard.otScope')}</p>
          <PillMultiSelect
            ariaLabel={t('dashboard.otScope')}
            value={valueDemands}
            onChange={setValueDemands}
            allLabel={t('dashboard.scopeAll')}
            options={valueDemandOptions.map((d) => ({ value: d.id, label: tl(d.label) }))}
          />
        </div>
        {valueStepOptions.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 px-0.5">{t('dashboard.otValueSteps')}</p>
            <PillMultiSelect
              ariaLabel={t('dashboard.otValueSteps')}
              value={valueStepIds}
              onChange={setValueStepIds}
              allLabel={t('dashboard.scopeAll')}
              options={valueStepOptions.map((s) => ({ value: s.id, label: tl(s.label) }))}
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium px-0.5">{t('dashboard.otShow')}</span>
        <PillToggle
          ariaLabel={t('dashboard.otShow')}
          value={series}
          onChange={(v) => { setSeries(v as Series); if (v !== 'sc') setScId(''); }}
          options={seriesOptions}
        />
        {series === 'sc' && (
          <PillSelect
            value={scId}
            onChange={setScId}
            placeholder={t('dashboard.otPickSc')}
            ariaLabel={t('dashboard.otPickSc')}
            options={(scOptions ?? []).map((o) => ({ id: o.id, label: `${tl(o.label)} (${o.count})` }))}
          />
        )}
        {capData && (
          <>
            <span className="flex-1" />
            <PillToggle
              ariaLabel={t('dashboard.countMode')}
              value={mode}
              onChange={(v) => setMode(v as 'count' | 'pct')}
              options={[{ value: 'count', label: t('dashboard.countMode') }, { value: 'pct', label: t('dashboard.pctMode') }]}
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <XmRChart
      title={t('dashboard.otTitle')}
      subtitle={seriesName || undefined}
      valueLabel={valueLabel || t('dashboard.otShow')}
      data={capData}
      loading={!!seriesParam && rows === null}
      controls={controls}
      fmtValue={fmtValue}
      info={<InfoPopover label={t('dashboard.otTitle')}>{t('dashboard.calcOtExplorer')}</InfoPopover>}
      actions={onRemove && (
        <button type="button" onClick={onRemove} className="px-2.5 py-1 rounded-md text-xs font-medium text-red-500 hover:bg-red-50" aria-label={t('dashboard.removeChart')}>
          {t('dashboard.removeChart')}
        </button>
      )}
      nLabel={t('dashboard.otDays')}
      emptyText={!seriesParam ? t('dashboard.otHint') : t('dashboard.otNoData')}
      plainX
    />
  );
}
