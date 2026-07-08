'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';
import type { CapabilityData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import PillSelect, { type PillSelectOption } from '@/components/PillSelect';
import PillToggle from '@/components/PillToggle';
import InfoPopover from '@/components/InfoPopover';
import { exportNodeToPng } from '@/lib/chart-image';
import { useCollapsibleCards } from '@/components/collapsible-cards-context';

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

// Compact (2026-07-02): the capability stat tiles sit six-across on one row under
// the chart, so they're small — smaller padding + value than the dashboard cards.
function Card({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg shadow-sm p-2 bg-white border border-gray-200">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 leading-tight">{label}</p>
      <p className="text-base font-bold mt-0.5 leading-none" style={{ color: color || '#1f2937' }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5 text-gray-400">{sub}</p>}
    </div>
  );
}

export default function CapabilityChart({
  code, eventOptions, studyName, dateFrom, dateTo, valueDemands, whatMattersScopeTypeId, onRemove,
}: {
  code: string;
  eventOptions: PillSelectOption[];
  studyName: string;
  dateFrom?: string;
  dateTo?: string;
  valueDemands?: string[];
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
  // Popup exclude toggle (local until Save) + the expandable notes list state.
  const [capExcluded, setCapExcluded] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [capExporting, setCapExporting] = useState(false);
  const capExportRef = useRef<HTMLDivElement>(null);
  // Flow dashboards render cards collapsible. Collapse clips the body (CSS) so
  // the chart stays mounted + captureable by the PPTX export even while closed.
  const collapsible = useCollapsibleCards();
  const [open, setOpen] = useState(true);

  // Default the pickers once options are known: case opened → first milestone
  // (or first decision, or case closed).
  useEffect(() => {
    if (capFrom || capTo || eventOptions.length === 0) return;
    const firstMs = eventOptions.find((o) => o.id.startsWith('milestone:'));
    const firstDp = eventOptions.find((o) => o.id.startsWith('decision:'));
    /* eslint-disable react-hooks/set-state-in-effect */
    setCapFrom('caseOpen');
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
    if (valueDemands && valueDemands.length) qp.set('valueDemands', valueDemands.join(','));
    if (whatMattersScopeTypeId) qp.set('wmScope', whatMattersScopeTypeId);
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/capability?${qp}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setCapData(d))
      .finally(() => setCapLoading(false));
  }, [capFrom, capTo, code, dateFrom, dateTo, valueDemands, whatMattersScopeTypeId, capTick, capSort, capMetric]);

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

  // Memoized so the recharts LineChart's `data` isn't rebuilt (new identity) on
  // every keystroke in the inspector note/reason inputs, which live in this same
  // component. Depends only on capData.
  const chartPoints = useMemo(
    () => (capData ? capData.points.map((p) => ({ ...p, includedValue: p.excluded ? null : p.leadTime, excludedValue: p.excluded ? p.leadTime : null })) : []),
    [capData],
  );

  return (
    <div className="rounded-xl shadow-sm p-5 bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          {t('dashboard.capabilityLeadTime')}
          {capMetric === 'leadTime' && (
            <InfoPopover label={t('dashboard.leadTimeExcludeHelp')}>
              {t('dashboard.leadTimeExcludeHelp')}
              {capData && capData.nWantedByDate > 0 ? ` ${t('dashboard.leadTimeExcludedCount', { count: String(capData.nWantedByDate) })}` : ''}
            </InfoPopover>
          )}
        </h3>
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
      </div>

      <div className={collapsible && !open ? 'max-h-0 overflow-hidden' : ''}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-medium text-gray-500">{t('dashboard.eventFrom')}</span>
        <PillSelect value={capFrom} onChange={pickFrom} options={eventOptions} placeholder={t('dashboard.eventFrom')} ariaLabel={t('dashboard.eventFrom')} />
        <span className="text-gray-400" aria-hidden="true">→</span>
        <span className="text-xs font-medium text-gray-500">{t('dashboard.eventTo')}</span>
        <PillSelect value={capTo} onChange={setCapTo} options={eventOptions} placeholder={t('dashboard.eventTo')} ariaLabel={t('dashboard.eventTo')} />
        <span className="ml-2 text-xs font-medium text-gray-500">{t('dashboard.metricLabel')}</span>
        <PillToggle
          ariaLabel={t('dashboard.metricLabel')}
          value={capMetric}
          onChange={(v) => setCapMetric(v as 'leadTime' | 'touches' | 'variance')}
          options={[
            { value: 'leadTime', label: t('dashboard.metricLeadTime') },
            { value: 'touches', label: t('dashboard.metricTouches') },
            { value: 'variance', label: t('dashboard.metricVariance') },
          ]}
        />
        <span className="ml-2 text-xs font-medium text-gray-500">{t('dashboard.sortLabel')}</span>
        <PillToggle
          ariaLabel={t('dashboard.sortLabel')}
          value={capSort}
          onChange={(v) => setCapSort(v as 'start' | 'closed')}
          options={[
            { value: 'start', label: t('dashboard.evCaseOpened') },
            { value: 'closed', label: t('dashboard.sortClosed') },
          ]}
        />
      </div>

      {!capFrom || !capTo ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.capabilitySelectEvents')}</p>
      ) : capLoading && !capData ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.loading')}</p>
      ) : !capData || capData.points.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.capabilityNoData')}</p>
      ) : (() => {
        const data = capData;
        const selPoint = data.points.find((p) => p.caseId === selectedCapCaseId) || null;
        const openInspector = (pt: typeof data.points[number]) => { setSelectedCapCaseId(pt.caseId); setCapNote(pt.note ?? ''); setCapReason(''); setCapExcluded(pt.excluded); };
        const annotated = data.points.filter((p) => p.note || p.excluded);
        const saveAndClose = () => {
          if (!selPoint) return;
          const patch: { excluded: boolean; note: string | null; excludedReason?: string | null } = { excluded: capExcluded, note: capNote.trim() || null };
          patch.excludedReason = capExcluded ? (capReason.trim() || null) : null;
          void saveCapAnnotation(selPoint.caseId, patch);
          setSelectedCapCaseId(null);
        };
        const fromLabel = (eventOptions.find((o) => o.id === capFrom)?.label || capFrom).replace(/^◇ /, '');
        const toLabel = (eventOptions.find((o) => o.id === capTo)?.label || capTo).replace(/^◇ /, '');
        const isTouches = data.unit === 'touches';
        const isVariance = capMetric === 'variance';
        const valueLabel = isTouches ? t('dashboard.touchesPerCase') : isVariance ? t('dashboard.metricVarianceAxis') : t('dashboard.leadTimeDays');
        // Variance is signed: +n = n days late, -n = n days early.
        const fmtValue = (v: number | null) => v == null ? '—' : (isTouches ? `${v}` : `${isVariance && v > 0 ? '+' : ''}${v} ${t('dashboard.daysShort')}`);
        const subtitle = `${fromLabel} → ${toLabel} · ${valueLabel} · ${t('dashboard.sortLabel')}: ${capSort === 'closed' ? t('dashboard.sortClosed') : t('dashboard.evCaseOpened')}`;
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
                {/* extendDomain so a limit above the data max (e.g. a wide UNPL with
                    few points) grows the Y axis instead of being discarded/clipped. */}
                {data.mean != null && <ReferenceLine y={data.mean} ifOverflow="extendDomain" stroke={THEME.textSecondary} strokeDasharray="5 4" label={{ value: t('dashboard.processAvg'), position: 'right', fill: THEME.textSecondary, fontSize: 10 }} />}
                {data.unpl != null && <ReferenceLine y={data.unpl} ifOverflow="extendDomain" stroke={COLORS.failure} strokeDasharray="5 4" label={{ value: t('dashboard.upperLimit'), position: 'right', fill: COLORS.failure, fontSize: 10 }} />}
                {data.lnpl != null && <ReferenceLine y={data.lnpl} ifOverflow="extendDomain" stroke={COLORS.failure} strokeDasharray="5 4" label={{ value: t('dashboard.lowerLimit'), position: 'right', fill: COLORS.failure, fontSize: 10 }} />}
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
                        {payload.caseId === selectedCapCaseId && <circle cx={cx} cy={cy} r={9} fill="none" stroke="var(--color-brand)" strokeWidth={2} />}
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
                        {payload.caseId === selectedCapCaseId && <circle cx={cx} cy={cy} r={9} fill="none" stroke="var(--color-brand)" strokeWidth={2} />}
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
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
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
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Card label={t('dashboard.wmMetOnTime')} value={`${met}`} sub={`${pct(met)}%`} color={COLORS.value} />
                  <Card label={t('dashboard.wmMissedLate')} value={`${late.length}`} sub={`${pct(late.length)}%`} color={COLORS.failure} />
                  <Card label={t('dashboard.wmAvgDaysLate')} value={late.length ? `${avgLate} ${t('dashboard.daysShort')}` : '—'} />
                </div>
              );
            })()}
          </div>{/* end export region */}
          <p className="mt-2 text-center text-[11px] text-gray-400">{t('dashboard.capabilityInspectHint')}</p>

          {/* Saved notes & exclusions — collapsed by default; a row re-opens its
              popup. The note also shows in the hover tooltip above. */}
          {annotated.length > 0 && (
            <div className="mt-3">
              <button type="button" onClick={() => setNotesOpen((o) => !o)} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900">
                <span className="text-gray-400">{notesOpen ? '▾' : '▸'}</span>
                {t('dashboard.capabilityNotesList')} ({annotated.length})
              </button>
              {notesOpen && (
                <ul className="mt-2 space-y-1.5">
                  {annotated.map((p) => (
                    <li key={p.caseId}>
                      <button type="button" onClick={() => openInspector(p)} className="w-full text-left flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 hover:bg-gray-50">
                        <span className="text-xs font-semibold text-gray-800 shrink-0">#{p.caseRef}</span>
                        {p.excluded && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">{t('dashboard.excludedLegend')}</span>}
                        {p.note && <span className="text-xs text-gray-500 italic truncate">“{p.note}”</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Pop-up note box (2026-07-02): opens on point click; type the note,
              optionally exclude with a reason, then Save. */}
          {selPoint && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSelectedCapCaseId(null)}>
              <div className="w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">#{selPoint.caseRef} · {fmtValue(selPoint.leadTime)}</p>
                  <button type="button" onClick={() => setSelectedCapCaseId(null)} aria-label={t('dashboard.capabilityClose')} className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1">×</button>
                </div>
                <label className="block text-xs text-gray-500">
                  {t('dashboard.capabilityNote')}
                  <textarea
                    autoFocus
                    value={capNote}
                    onChange={(e) => setCapNote(e.target.value)}
                    rows={3}
                    placeholder={t('dashboard.capabilityNotePh')}
                    className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={capExcluded} onChange={(e) => setCapExcluded(e.target.checked)} className="rounded border-gray-300" />
                  {t('dashboard.capabilityExclude')}
                </label>
                {capExcluded && (
                  <input
                    type="text"
                    value={capReason}
                    onChange={(e) => setCapReason(e.target.value)}
                    placeholder={t('dashboard.capabilityReason')}
                    className="w-full px-2 py-1.5 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
                  />
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setSelectedCapCaseId(null)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">{t('dashboard.capabilityClose')}</button>
                  <button type="button" onClick={saveAndClose} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-hover transition-colors">{t('settings.save')}</button>
                </div>
              </div>
            </div>
          )}
        </>
        );
      })()}
      </div>
    </div>
  );
}
