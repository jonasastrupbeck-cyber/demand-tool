'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import type { TouchSeriesPoint } from '@/types';
import { useLocale } from '@/lib/locale-context';
import PillToggle from '@/components/PillToggle';
import { useCollapsibleCards } from '@/components/collapsible-cards-context';

// "Touches over time" — per-day touch counts, scoped (all / life problem / case),
// switchable between count and % of touches per day. A touch = a work entry;
// bucketed by its effective date (server-side). Mirrors CapabilityChart's shell.
const THEME = { textSecondary: '#6b7280', grid: '#e5e7eb' };
const COLORS = { total: '#6b7280', value: '#22c55e', failure: '#ef4444', sequence: '#10b981' };
const tickStyle = { fontSize: 11, fill: THEME.textSecondary };
const tooltipStyle = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#1f2937' },
  labelStyle: { color: '#1f2937' },
  itemStyle: { color: THEME.textSecondary },
};

export default function TouchSeriesChart({
  code, lifeProblems, cases, dateFrom, dateTo,
}: {
  code: string;
  lifeProblems: { id: string; label: string }[];
  cases: { id: string; caseRef: string }[];
  dateFrom?: string;
  dateTo?: string;
}) {
  const { t, tl } = useLocale();
  // scope encoded as 'all' | 'lp:<id>' | 'case:<id>'
  const [scope, setScope] = useState('all');
  const [mode, setMode] = useState<'count' | 'pct'>('count');
  const [series, setSeries] = useState<TouchSeriesPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const collapsible = useCollapsibleCards();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const qp = new URLSearchParams();
    if (dateFrom) qp.set('from', dateFrom);
    if (dateTo) qp.set('to', dateTo);
    if (scope.startsWith('lp:')) qp.set('p2bs', scope.slice(3));
    else if (scope.startsWith('case:')) qp.set('caseId', scope.slice(5));
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/touches-over-time?${qp}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setSeries(d))
      .finally(() => setLoading(false));
  }, [code, scope, dateFrom, dateTo]);

  // % mode: each classification as % of that day's touches (guard total=0).
  const chartData = useMemo(() => {
    if (!series) return [];
    if (mode === 'count') return series;
    return series.map((p) => ({
      ...p,
      valuePct: p.total ? (p.valueCount / p.total) * 100 : 0,
      failurePct: p.total ? (p.failureCount / p.total) * 100 : 0,
      sequencePct: p.total ? (p.sequenceCount / p.total) * 100 : 0,
    }));
  }, [series, mode]);

  return (
    <div className="rounded-xl shadow-sm p-5 bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="flex-1 text-sm font-semibold text-gray-700">{t('dashboard.touchesOverTime')}</h3>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="shrink-0 text-gray-400 hover:text-gray-600 text-xs leading-none px-1 py-0.5 transition-colors"
          >
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>

      <div className={collapsible && !open ? 'max-h-0 overflow-hidden' : ''}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          aria-label={t('dashboard.touchesOverTime')}
          className="px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700 focus:ring-2 focus:ring-brand outline-none"
        >
          <option value="all">{t('dashboard.scopeAll')}</option>
          {lifeProblems.length > 0 && (
            <optgroup label={t('capture.caseTableP2bs')}>
              {lifeProblems.map((lp) => (
                <option key={lp.id} value={`lp:${lp.id}`}>{tl(lp.label)}</option>
              ))}
            </optgroup>
          )}
          {cases.length > 0 && (
            <optgroup label={t('dashboard.scopeCase')}>
              {cases.map((c) => (
                <option key={c.id} value={`case:${c.id}`}>#{c.caseRef}</option>
              ))}
            </optgroup>
          )}
        </select>

        <PillToggle
          ariaLabel={t('dashboard.countMode')}
          value={mode}
          onChange={(v) => setMode(v as 'count' | 'pct')}
          options={[
            { value: 'count', label: t('dashboard.countMode') },
            { value: 'pct', label: t('dashboard.pctMode') },
          ]}
        />
      </div>

      {loading && !series ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.loading')}</p>
      ) : !series || series.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.capabilityNoData')}</p>
      ) : (
        <div data-chart-export data-chart-title={t('dashboard.touchesOverTime')} className="bg-white">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
            <XAxis dataKey="date" tick={tickStyle} />
            {mode === 'count'
              ? <YAxis allowDecimals={false} tick={tickStyle} />
              : <YAxis domain={[0, 100]} tick={tickStyle} unit="%" />}
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ color: THEME.textSecondary }} />
            {mode === 'count' ? (
              <>
                <Line type="monotone" dataKey="total" name={t('dashboard.touchesTotal')} stroke={COLORS.total} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="valueCount" name={t('capture.value')} stroke={COLORS.value} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="failureCount" name={t('capture.failure')} stroke={COLORS.failure} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sequenceCount" name={t('capture.classificationWorkSequence')} stroke={COLORS.sequence} strokeWidth={2} dot={{ r: 3 }} />
              </>
            ) : (
              <>
                <Line type="monotone" dataKey="valuePct" name={t('capture.value')} stroke={COLORS.value} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="failurePct" name={t('capture.failure')} stroke={COLORS.failure} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sequencePct" name={t('capture.classificationWorkSequence')} stroke={COLORS.sequence} strokeWidth={2} dot={{ r: 3 }} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
        </div>
      )}
      </div>
    </div>
  );
}
