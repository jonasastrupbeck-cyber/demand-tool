'use client';

import { useState, type ReactNode } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';
import type { CapabilityData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import { useCollapsibleCards } from '@/components/collapsible-cards-context';

// Lean, presentational XmR (individuals) chart card (2026-07-08). Renders a
// CapabilityData series (one point per case, or per day for over-time) as a
// control chart + stat tiles. Shared by the touches-per-case, steps-per-case and
// over-time-explorer charts.
//
// Annotation (2026-07-09): pass `annotate` to make points clickable — a note +
// optional exclude-from-limits per point, mirroring CapabilityChart. The point's
// `excluded`/`note` come in on the data (server- or client-computed); this
// component renders them (greyed ✖ / amber ring / hover note / notes list) and
// posts edits back via `annotate.onSave`. Without `annotate`, dots are plain and
// non-interactive (unchanged behaviour).
const THEME = { textSecondary: '#6b7280', grid: '#e5e7eb' };
const COLORS = { value: '#22c55e', failure: '#ef4444', neutral: '#3b82f6' };
const tooltipStyle = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#1f2937', fontSize: 11 },
  labelStyle: { color: '#1f2937' },
  itemStyle: { color: THEME.textSecondary },
};

function Card({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg shadow-sm p-2 bg-white border border-gray-200">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 leading-tight">{label}</p>
      <p className="text-base font-bold mt-0.5 leading-none" style={{ color: color || '#1f2937' }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5 text-gray-400">{sub}</p>}
    </div>
  );
}

type AnnoPatch = { excluded: boolean; excludedReason: string | null; note: string | null };

export default function XmRChart({
  title, subtitle, valueLabel, data, loading, controls, fmtValue, info, actions, nLabel, emptyText, plainX, annotate,
}: {
  title: string;
  subtitle?: string;
  valueLabel: string;
  data: CapabilityData | null;
  loading?: boolean;
  controls?: ReactNode;
  /** Format a value for tiles/tooltip. Defaults to the raw number. */
  fmtValue?: (v: number | null) => string;
  /** Optional info affordance (e.g. an <InfoPopover>) shown beside the title. */
  info?: ReactNode;
  /** Optional header actions (e.g. a Remove button), rendered before the collapse chevron. */
  actions?: ReactNode;
  /** Label for the first stat tile. Defaults to "Cases" — override when points aren't cases (e.g. days). */
  nLabel?: string;
  /** Copy for the empty state. Defaults to the capability "no data" text. */
  emptyText?: string;
  /** Plain x labels: tooltip shows the caseRef as-is (no "#" or date suffix) — for date-keyed points. */
  plainX?: boolean;
  /** When set, points are clickable to add a note / exclude from limits. `onSave`
   *  persists the edit (keyed by the point's caseId) and should refresh `data`. */
  annotate?: { onSave: (pointKey: string, patch: AnnoPatch) => Promise<void> };
}) {
  const { t } = useLocale();
  const collapsible = useCollapsibleCards();
  const [open, setOpen] = useState(true);
  const fmt = fmtValue ?? ((v: number | null) => (v == null ? '—' : String(v)));
  // Split so excluded points render greyed and drop out of the drawn line.
  const chartPoints = data ? data.points.map((p) => ({ ...p, includedValue: p.excluded ? null : p.leadTime, excludedValue: p.excluded ? p.leadTime : null })) : [];

  // Annotation inspector state (only used when `annotate` is set).
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [excluded, setExcluded] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selPoint = data && selectedKey ? data.points.find((p) => p.caseId === selectedKey) ?? null : null;
  const annotated = data ? data.points.filter((p) => p.note || p.excluded) : [];
  const pointLabel = (p: { caseRef: string; startedAt: string }) => plainX ? p.caseRef : `#${p.caseRef}`;
  const openInspector = (p: NonNullable<typeof selPoint>) => { setSelectedKey(p.caseId); setNote(p.note ?? ''); setReason(''); setExcluded(p.excluded); };
  const saveAndClose = async () => {
    if (!selPoint || !annotate || saving) return;
    setSaving(true);
    try {
      await annotate.onSave(selPoint.caseId, { excluded, excludedReason: excluded ? (reason.trim() || null) : null, note: note.trim() || null });
      setSelectedKey(null);
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-xl shadow-sm p-5 bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {info}
        <span className="flex-1" />
        {actions}
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
        {controls && <div className="flex flex-wrap items-center gap-2 mb-3">{controls}</div>}

        {loading && !data ? (
          <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.loading')}</p>
        ) : !data || data.points.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{emptyText ?? t('dashboard.capabilityNoData')}</p>
        ) : (
          <div data-chart-export data-chart-title={subtitle ? `${title} — ${subtitle}` : title} className="bg-white">
            {subtitle && <p className="text-xs text-gray-500 mb-2">{subtitle}</p>}
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartPoints} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                <XAxis dataKey="caseRef" tick={{ fontSize: 10, fill: THEME.textSecondary }} />
                <YAxis allowDecimals tick={{ fontSize: 11, fill: THEME.textSecondary }} label={{ value: valueLabel, angle: -90, position: 'insideLeft', fill: THEME.textSecondary, fontSize: 11 }} />
                <Tooltip {...tooltipStyle} content={(p: { active?: boolean; payload?: readonly { payload?: typeof data.points[number] }[] }) => {
                  const pt = p.active && p.payload && p.payload.length ? p.payload[0].payload : null;
                  if (!pt) return null;
                  return (
                    <div className="rounded-lg shadow-md bg-white border border-gray-200 px-3 py-2 text-[11px] text-gray-700">
                      <div className="font-medium text-gray-900">{plainX ? pt.caseRef : `#${pt.caseRef} · ${new Date(pt.startedAt).toLocaleDateString()}`}</div>
                      <div>{valueLabel}: {fmt(pt.leadTime)}</div>
                      {pt.excluded && <div className="text-amber-700">{t('dashboard.excludedLegend')}</div>}
                      {pt.note && <div className="text-gray-500 italic max-w-[220px]">“{pt.note}”</div>}
                    </div>
                  );
                }} />
                {/* extendDomain so a limit above the data max (common with few points,
                    e.g. UNPL) grows the Y axis instead of being discarded/clipped. */}
                {/* Short labels (UCL/LCL/Av) just above each line, inside the plot so
                    they're not clipped. LCL label omitted when it's 0 (sits on the axis). */}
                {data.mean != null && <ReferenceLine y={data.mean} ifOverflow="extendDomain" stroke={THEME.textSecondary} strokeDasharray="5 4" label={{ value: t('dashboard.avgShort'), position: 'insideTopRight', fill: THEME.textSecondary, fontSize: 10 }} />}
                {data.unpl != null && <ReferenceLine y={data.unpl} ifOverflow="extendDomain" stroke={COLORS.failure} strokeDasharray="5 4" label={{ value: t('dashboard.uclShort'), position: 'insideTopRight', fill: COLORS.failure, fontSize: 10 }} />}
                {data.lnpl != null && <ReferenceLine y={data.lnpl} ifOverflow="extendDomain" stroke={COLORS.failure} strokeDasharray="5 4" label={data.lnpl === 0 ? undefined : { value: t('dashboard.lclShort'), position: 'insideTopRight', fill: COLORS.failure, fontSize: 10 }} />}
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
                    const inner = (
                      <>
                        {annotate && <circle cx={cx} cy={cy} r={12} fill="transparent" />}
                        {annotate && payload.caseId === selectedKey && <circle cx={cx} cy={cy} r={9} fill="none" stroke="var(--color-brand)" strokeWidth={2} />}
                        {payload.note && <circle cx={cx} cy={cy} r={8} fill="none" stroke="#d97706" strokeWidth={1.5} />}
                        <circle cx={cx} cy={cy} r={special ? 5 : 3.5} fill={special ? COLORS.failure : COLORS.neutral} stroke="#fff" strokeWidth={1} />
                      </>
                    );
                    return annotate
                      ? <g key={`i-${payload.caseId}`} style={{ cursor: 'pointer' }} onClick={() => openInspector(payload)}>{inner}</g>
                      : <g key={`i-${payload.caseId}`}>{inner}</g>;
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
                      <g key={`x-${payload.caseId}`} style={annotate ? { cursor: 'pointer' } : undefined} onClick={annotate ? () => openInspector(payload) : undefined}>
                        <circle cx={cx} cy={cy} r={12} fill="transparent" />
                        {annotate && payload.caseId === selectedKey && <circle cx={cx} cy={cy} r={9} fill="none" stroke="var(--color-brand)" strokeWidth={2} />}
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
              <Card label={nLabel ?? t('dashboard.capabilityCases')} value={data.n} sub={data.nExcluded > 0 ? `+${data.nExcluded} ${t('dashboard.excludedLegend').toLowerCase()}` : undefined} />
              <Card label={t('dashboard.processAvg')} value={fmt(data.mean)} color={THEME.textSecondary} />
              <Card label={t('dashboard.capabilityMedian')} value={fmt(data.median)} />
              <Card label={t('dashboard.upperLimit')} value={fmt(data.unpl)} color={COLORS.failure} />
              <Card label={t('dashboard.lowerLimit')} value={fmt(data.lnpl)} color={COLORS.failure} />
              <Card label={t('dashboard.signals')} value={data.points.filter((p) => p.special).length} color={data.points.some((p) => p.special) ? COLORS.failure : COLORS.value} />
            </div>

            {annotate && (
              <p className="mt-2 text-center text-[11px] text-gray-400">{t('dashboard.capabilityInspectHint')}</p>
            )}

            {/* Saved notes & exclusions — collapsed by default; a row re-opens its popup. */}
            {annotate && annotated.length > 0 && (
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
                          <span className="text-xs font-semibold text-gray-800 shrink-0">{pointLabel(p)}</span>
                          {p.excluded && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">{t('dashboard.excludedLegend')}</span>}
                          {p.note && <span className="text-xs text-gray-500 italic truncate">“{p.note}”</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pop-up note box: opens on point click; type the note, optionally exclude
          with a reason, then Save. */}
      {annotate && selPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSelectedKey(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">{pointLabel(selPoint)} · {fmt(selPoint.leadTime)}</p>
              <button type="button" onClick={() => setSelectedKey(null)} aria-label={t('dashboard.capabilityClose')} className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1">×</button>
            </div>
            <label className="block text-xs text-gray-500">
              {t('dashboard.capabilityNote')}
              <textarea
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={t('dashboard.capabilityNotePh')}
                className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={excluded} onChange={(e) => setExcluded(e.target.checked)} className="rounded border-gray-300" />
              {t('dashboard.capabilityExclude')}
            </label>
            {excluded && (
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('dashboard.capabilityReason')}
                className="w-full px-2 py-1.5 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-brand outline-none"
              />
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setSelectedKey(null)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">{t('dashboard.capabilityClose')}</button>
              <button type="button" onClick={saveAndClose} disabled={saving} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-hover transition-colors disabled:opacity-50">{t('settings.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
