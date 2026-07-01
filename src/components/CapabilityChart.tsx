'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';
import type { CapabilityData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import PillSelect, { type PillSelectOption } from '@/components/PillSelect';
import { exportNodeToPng } from '@/lib/chart-image';

// R11 (2026-06-18): one capability (XmR) chart, self-contained so the flow
// dashboard can stack several to compare measures in parallel. Each instance
// owns its from/to/metric/sort + data fetch + point inspector + PNG export.
// The export region carries data-capability-export + data-cap-title so the
// parent can collect every chart for the branded PowerPoint export.

const THEME = { textSecondary: '#6b7280', grid: '#e5e7eb' };
const COLORS = { value: '#22c55e', failure: '#ef4444', neutral: '#3b82f6' };
const tooltipStyle = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#1f2937' },
  labelStyle: { color: '#1f2937' },
  itemStyle: { color: THEME.textSecondary },
};

function Card({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl shadow-sm p-4 bg-white border border-gray-200">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: color || '#1f2937' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5 text-gray-400">{sub}</p>}
    </div>
  );
}

export default function CapabilityChart({
  code, eventOptions, studyName, dateFrom, dateTo, lifeProblemId, whatMattersScopeTypeId, onRemove,
}: {
  code: string;
  eventOptions: PillSelectOption[];
  studyName: string;
  dateFrom?: string;
  dateTo?: string;
  lifeProblemId?: string | null;
  whatMattersScopeTypeId?: string | null;
  onRemove?: () => void;
}) {
  const { t } = useLocale();
  const [capFrom, setCapFrom] = useState('');
  const [capTo, setCapTo] = useState('');
  const [capSort, setCapSort] = useState<'start' | 'closed'>('start');
  const [capMetric, setCapMetric] = useState<'leadTime' | 'touches' | 'variance'>('leadTime');
  // Picking the customer's-date event switches to the signed "days early/late"
  // metric (leadTime would drop cases finished before the date as negatives).
  const pickFrom = (v: string) => { setCapFrom(v); if (v.startsWith('whatMattersTarget:')) setCapMetric('variance'); };
  const [capData, setCapData] = useState<CapabilityData | null>(null);
  const [capLoading, setCapLoading] = useState(false);
  const [capTick, setCapTick] = useState(0);
  const [selectedCapCaseId, setSelectedCapCaseId] = useState<string | null>(null);
  const [capNote, setCapNote] = useState('');
  const [capReason, setCapReason] = useState('');
  const [capExporting, setCapExporting] = useState(false);
  const capExportRef = useRef<HTMLDivElement>(null);

  // Default the pickers once options are known: first contact → first milestone
  // (or first decision, or case closed).
  useEffect(() => {
    if (capFrom || capTo || eventOptions.length === 0) return;
    const firstMs = eventOptions.find((o) => o.id.startsWith('milestone:'));
    const firstDp = eventOptions.find((o) => o.id.startsWith('decision:'));
    /* eslint-disable react-hooks/set-state-in-effect */
    setCapFrom('firstContact');
    setCapTo(firstMs?.id || firstDp?.id || 'caseClose');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [eventOptions, capFrom, capTo]);

  // Fetch when the measure (events / sort / metric / date range) changes.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!capFrom || !capTo) { setCapData(null); return; }
    setCapLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const qp = new URLSearchParams({ fromEvent: capFrom, toEvent: capTo, sort: capSort, metric: capMetric });
    if (dateFrom) qp.set('dateFrom', dateFrom);
    if (dateTo) qp.set('dateTo', dateTo);
    if (lifeProblemId) qp.set('p2bs', lifeProblemId);
    if (whatMattersScopeTypeId) qp.set('wmScope', whatMattersScopeTypeId);
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/capability?${qp}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setCapData(d))
      .finally(() => setCapLoading(false));
  }, [capFrom, capTo, code, dateFrom, dateTo, lifeProblemId, whatMattersScopeTypeId, capTick, capSort, capMetric]);

  const handleExportImage = useCallback(async () => {
    if (!capExportRef.current || capExporting) return;
    setCapExporting(true);
    try { await exportNodeToPng(capExportRef.current, `capability-${code}.png`); } catch {}
    setCapExporting(false);
  }, [code, capExporting]);

  const saveCapAnnotation = useCallback(async (caseId: string, patch: { excluded?: boolean; excludedReason?: string | null; note?: string | null }) => {
    await fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/capability/annotation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, fromEvent: capFrom, toEvent: capTo, ...patch }),
    });
    setCapTick((n) => n + 1);
  }, [code, capFrom, capTo]);

  return (
    <div className="rounded-xl shadow-sm p-5 bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{t('dashboard.capabilityLeadTime')}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportImage}
            disabled={capExporting || !capData || capData.points.length === 0}
            className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {capExporting ? '...' : t('dashboard.exportImage')}
          </button>
          {onRemove && (
            <button type="button" onClick={onRemove} className="px-2.5 py-1 rounded-md text-xs font-medium text-red-500 hover:bg-red-50" aria-label={t('dashboard.removeChart')}>
              {t('dashboard.removeChart')}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-medium text-gray-500">{t('dashboard.eventFrom')}</span>
        <PillSelect value={capFrom} onChange={pickFrom} options={eventOptions} placeholder={t('dashboard.eventFrom')} ariaLabel={t('dashboard.eventFrom')} />
        <span className="text-gray-400" aria-hidden="true">→</span>
        <span className="text-xs font-medium text-gray-500">{t('dashboard.eventTo')}</span>
        <PillSelect value={capTo} onChange={setCapTo} options={eventOptions} placeholder={t('dashboard.eventTo')} ariaLabel={t('dashboard.eventTo')} />
        <span className="ml-2 text-xs font-medium text-gray-500">{t('dashboard.metricLabel')}</span>
        <div className="flex gap-1 rounded-lg p-0.5 bg-gray-100 border border-gray-200">
          {(['leadTime', 'touches', 'variance'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setCapMetric(m)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${capMetric === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {m === 'leadTime' ? t('dashboard.metricLeadTime') : m === 'touches' ? t('dashboard.metricTouches') : t('dashboard.metricVariance')}
            </button>
          ))}
        </div>
        <span className="ml-2 text-xs font-medium text-gray-500">{t('dashboard.sortLabel')}</span>
        <div className="flex gap-1 rounded-lg p-0.5 bg-gray-100 border border-gray-200">
          {(['start', 'closed'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setCapSort(s)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${capSort === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'start' ? t('dashboard.sortStart') : t('dashboard.sortClosed')}
            </button>
          ))}
        </div>
      </div>

      {!capFrom || !capTo ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.capabilitySelectEvents')}</p>
      ) : capLoading && !capData ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.loading')}</p>
      ) : !capData || capData.points.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.capabilityNoData')}</p>
      ) : (() => {
        const data = capData;
        const chartPoints = data.points.map((p) => ({ ...p, includedValue: p.excluded ? null : p.leadTime, excludedValue: p.excluded ? p.leadTime : null }));
        const selPoint = data.points.find((p) => p.caseId === selectedCapCaseId) || null;
        const openInspector = (pt: typeof data.points[number]) => { setSelectedCapCaseId(pt.caseId); setCapNote(pt.note ?? ''); setCapReason(''); };
        const fromLabel = (eventOptions.find((o) => o.id === capFrom)?.label || capFrom).replace(/^◇ /, '');
        const toLabel = (eventOptions.find((o) => o.id === capTo)?.label || capTo).replace(/^◇ /, '');
        const isTouches = data.unit === 'touches';
        const isVariance = capMetric === 'variance';
        const valueLabel = isTouches ? t('dashboard.touchesPerCase') : isVariance ? t('dashboard.metricVarianceAxis') : t('dashboard.leadTimeDays');
        // Variance is signed: +n = n days late, -n = n days early.
        const fmtValue = (v: number | null) => v == null ? '—' : (isTouches ? `${v}` : `${isVariance && v > 0 ? '+' : ''}${v} ${t('dashboard.daysShort')}`);
        const subtitle = `${fromLabel} → ${toLabel} · ${valueLabel} · ${t('dashboard.sortLabel')}: ${capSort === 'closed' ? t('dashboard.sortClosed') : t('dashboard.sortStart')}`;
        return (
        <>
          {/* Captured region for image / PowerPoint export — title + chart + tiles. */}
          <div ref={capExportRef} data-capability-export data-cap-title={`${studyName} — ${subtitle}`} className="bg-white">
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-900">{studyName}</p>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartPoints} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                <XAxis dataKey="caseRef" tick={{ fontSize: 10, fill: THEME.textSecondary }} />
                <YAxis allowDecimals tick={{ fontSize: 11, fill: THEME.textSecondary }} label={{ value: valueLabel, angle: -90, position: 'insideLeft', fill: THEME.textSecondary, fontSize: 11 }} />
                <Tooltip {...tooltipStyle} content={(p: { active?: boolean; payload?: readonly { payload?: typeof data.points[number] }[] }) => {
                  const pt = p.active && p.payload && p.payload.length ? p.payload[0].payload : null;
                  if (!pt) return null;
                  return (
                    <div className="rounded-lg shadow-md bg-white border border-gray-200 px-3 py-2 text-xs text-gray-700">
                      <div className="font-medium text-gray-900">#{pt.caseRef} · {new Date(pt.startedAt).toLocaleDateString()}</div>
                      <div>{valueLabel}: {fmtValue(pt.leadTime)}</div>
                      {pt.excluded && <div className="text-amber-700">{t('dashboard.excludedLegend')}</div>}
                      {pt.note && <div className="text-gray-500 italic max-w-[220px]">“{pt.note}”</div>}
                    </div>
                  );
                }} />
                {data.mean != null && <ReferenceLine y={data.mean} stroke={THEME.textSecondary} strokeDasharray="5 4" label={{ value: t('dashboard.processAvg'), position: 'right', fill: THEME.textSecondary, fontSize: 10 }} />}
                {data.unpl != null && <ReferenceLine y={data.unpl} stroke={COLORS.failure} strokeDasharray="5 4" label={{ value: t('dashboard.upperLimit'), position: 'right', fill: COLORS.failure, fontSize: 10 }} />}
                {data.lnpl != null && <ReferenceLine y={data.lnpl} stroke={COLORS.failure} strokeDasharray="5 4" label={{ value: t('dashboard.lowerLimit'), position: 'right', fill: COLORS.failure, fontSize: 10 }} />}
                <Line
                  type="monotone"
                  dataKey="includedValue"
                  connectNulls
                  name={valueLabel}
                  stroke={COLORS.neutral}
                  strokeWidth={2}
                  isAnimationActive={false}
                  activeDot={false}
                  dot={(props: { cx?: number; cy?: number; payload?: typeof data.points[number] }) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined || !payload || payload.excluded) return <g key={`i-${payload?.caseId ?? cx}`} />;
                    const special = payload.special;
                    return (
                      <g key={`i-${payload.caseId}`} style={{ cursor: 'pointer' }} onClick={() => openInspector(payload)}>
                        <circle cx={cx} cy={cy} r={12} fill="transparent" />
                        {payload.note && <circle cx={cx} cy={cy} r={8} fill="none" stroke="#d97706" strokeWidth={1.5} />}
                        <circle cx={cx} cy={cy} r={special ? 5 : 3.5} fill={special ? COLORS.failure : COLORS.neutral} stroke="#fff" strokeWidth={1} />
                      </g>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="excludedValue"
                  stroke="none"
                  strokeWidth={0}
                  connectNulls={false}
                  isAnimationActive={false}
                  activeDot={false}
                  dot={(props: { cx?: number; cy?: number; payload?: typeof data.points[number] }) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined || !payload || !payload.excluded) return <g key={`x-${payload?.caseId ?? cx}`} />;
                    return (
                      <g key={`x-${payload.caseId}`} style={{ cursor: 'pointer' }} onClick={() => openInspector(payload)}>
                        <circle cx={cx} cy={cy} r={12} fill="transparent" />
                        <circle cx={cx} cy={cy} r={5} fill="#9ca3af" stroke="#374151" strokeWidth={1.5} />
                        <line x1={cx - 3.5} y1={cy - 3.5} x2={cx + 3.5} y2={cy + 3.5} stroke="#374151" strokeWidth={1.5} />
                        <line x1={cx - 3.5} y1={cy + 3.5} x2={cx + 3.5} y2={cy - 3.5} stroke="#374151" strokeWidth={1.5} />
                      </g>
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            {data.unpl == null && data.n > 0 && (
              <p className="mt-2 text-center text-xs text-gray-400">{t('dashboard.capabilityNeedMore')}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              <Card label={t('dashboard.capabilityCases')} value={data.n} sub={data.nExcluded > 0 ? `+${data.nExcluded} ${t('dashboard.excludedLegend').toLowerCase()}` : undefined} />
              <Card label={t('dashboard.processAvg')} value={fmtValue(data.mean)} color={THEME.textSecondary} />
              <Card label={t('dashboard.capabilityMedian')} value={fmtValue(data.median)} />
              <Card label={t('dashboard.upperLimit')} value={fmtValue(data.unpl)} color={COLORS.failure} />
              <Card label={t('dashboard.lowerLimit')} value={fmtValue(data.lnpl)} color={COLORS.failure} />
              <Card label={t('dashboard.signals')} value={data.points.filter((p) => p.special).length} color={data.points.some((p) => p.special) ? COLORS.failure : COLORS.value} />
            </div>
            {/* Met-the-date summary (variance only): met = finished on/before the
                customer's date (value ≤ 0), missed = late (value > 0). */}
            {isVariance && (() => {
              const vals = data.points.filter((p) => !p.excluded).map((p) => p.leadTime);
              const tot = vals.length;
              const met = vals.filter((v) => v <= 0).length;
              const late = vals.filter((v) => v > 0);
              const avgLate = late.length ? Math.round((late.reduce((s, v) => s + v, 0) / late.length) * 10) / 10 : 0;
              const pct = (x: number) => tot ? Math.round((x / tot) * 100) : 0;
              return (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <Card label={t('dashboard.wmMetOnTime')} value={`${met}`} sub={`${pct(met)}%`} color={COLORS.value} />
                  <Card label={t('dashboard.wmMissedLate')} value={`${late.length}`} sub={`${pct(late.length)}%`} color={COLORS.failure} />
                  <Card label={t('dashboard.wmAvgDaysLate')} value={late.length ? `${avgLate} ${t('dashboard.daysShort')}` : '—'} />
                </div>
              );
            })()}
          </div>{/* end export region */}
          <p className="mt-2 text-center text-[11px] text-gray-400">{t('dashboard.capabilityInspectHint')}</p>

          {selPoint && (
            <div className="mt-4 rounded-xl border border-gray-300 bg-gray-50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">#{selPoint.caseRef} · {fmtValue(selPoint.leadTime)}{selPoint.excluded ? ` · ${t('dashboard.excludedLegend')}` : ''}</p>
                <button type="button" onClick={() => setSelectedCapCaseId(null)} className="text-xs text-gray-500 hover:text-gray-800">{t('dashboard.capabilityClose')}</button>
              </div>
              {selPoint.excluded && (
                <input
                  type="text"
                  value={capReason}
                  onChange={(e) => setCapReason(e.target.value)}
                  onBlur={() => saveCapAnnotation(selPoint.caseId, { excluded: true, excludedReason: capReason || null })}
                  placeholder={t('dashboard.capabilityReason')}
                  className="w-full px-2 py-1.5 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                />
              )}
              <label className="block text-xs text-gray-500">
                {t('dashboard.capabilityNote')}
                <textarea
                  value={capNote}
                  onChange={(e) => setCapNote(e.target.value)}
                  onBlur={() => saveCapAnnotation(selPoint.caseId, { note: capNote || null })}
                  rows={2}
                  placeholder={t('dashboard.capabilityNotePh')}
                  className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => saveCapAnnotation(selPoint.caseId, { excluded: !selPoint.excluded, excludedReason: selPoint.excluded ? null : (capReason || null) })}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selPoint.excluded ? 'text-sky-700 bg-sky-50 hover:bg-sky-100' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
              >
                {selPoint.excluded ? t('dashboard.capabilityInclude') : t('dashboard.capabilityExclude')}
              </button>
            </div>
          )}
        </>
        );
      })()}
    </div>
  );
}
