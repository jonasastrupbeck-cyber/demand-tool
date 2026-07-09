'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocale } from '@/lib/locale-context';
import { useCollapsibleCards } from '@/components/collapsible-cards-context';
import InfoPopover from '@/components/InfoPopover';
import PillMultiSelect from '@/components/PillMultiSelect';
import PillSelect from '@/components/PillSelect';
import PillToggle from '@/components/PillToggle';

const THEME = { text: '#1f2937', textSecondary: '#6b7280', grid: '#e5e7eb' };
const tooltipStyle = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: THEME.text },
  labelStyle: { color: THEME.text },
  itemStyle: { color: THEME.textSecondary },
};
const tickStyle = { fontSize: 11, fill: THEME.textSecondary };
// Series colours match the capture strands (page-level COLORS); SC = sky.
const SERIES_COLOR: Record<string, string> = {
  value: '#22c55e', sequence: '#10b981', failure: '#ef4444', failure_demand: '#e11d48', sc: '#0ea5e9',
};

type Series = '' | 'value' | 'sequence' | 'failure' | 'failure_demand' | 'sc';
type Row = { date: string; count: number; scopeTotal: number };
type ScFreq = { id: string; label: string; count: number };

// Over-time explorer (2026-07-09): build ONE deliberately-chosen over-time series
// — a work classification or a specific system condition — within a chosen scope
// (value demand(s) → value step(s)). % = count ÷ the scope's total blocks per day
// (server-supplied scopeTotal), so a scoped chart never lies about its base.
// Deliberately INDEPENDENT of the dashboard's value-demand filter (Jonas
// 2026-07-09) — this card's own pickers are its single source of truth; only the
// global period (dateFrom/dateTo) applies. Stackable: one series per card, add
// more cards to compare (avoids the unreadable multi-line SC tooltips).
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
  const collapsible = useCollapsibleCards();
  const [open, setOpen] = useState(true);
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
  const chartRows = (rows ?? []).map((r) => ({
    ...r,
    plotted: mode === 'pct' ? (r.scopeTotal > 0 ? Math.round((r.count / r.scopeTotal) * 100) : 0) : r.count,
  }));

  return (
    <div className="rounded-xl shadow-sm bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-gray-700">{t('dashboard.otTitle')}</h3>
        <InfoPopover label={t('dashboard.otTitle')}>{t('dashboard.calcOtExplorer')}</InfoPopover>
        <span className="flex-1" />
        {onRemove && (
          <button type="button" onClick={onRemove} className="px-2.5 py-1 rounded-md text-xs font-medium text-red-500 hover:bg-red-50" aria-label={t('dashboard.removeChart')}>
            {t('dashboard.removeChart')}
          </button>
        )}
        {collapsible && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Collapse' : 'Expand'} className="shrink-0 text-gray-400 hover:text-gray-600 text-xs leading-none px-1 py-0.5 transition-colors">
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>
      <div className={collapsible && !open ? 'max-h-0 overflow-hidden' : ''}>
        <div className="px-5 pt-1 pb-5 space-y-3">
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
            {seriesParam && rows && rows.length > 0 && (
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
          {!seriesParam ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.otHint')}</p>
          ) : rows === null ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.loading')}</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.otNoData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis allowDecimals={false} tick={tickStyle} domain={mode === 'pct' ? [0, 100] : undefined} tickFormatter={mode === 'pct' ? (v) => `${v}%` : undefined} />
                <Tooltip {...tooltipStyle} formatter={mode === 'pct' ? (v) => `${v}%` : undefined} />
                <Line type="monotone" dataKey="plotted" name={seriesName} stroke={SERIES_COLOR[series] ?? THEME.textSecondary} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
