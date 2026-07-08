'use client';

import { useState, type ReactNode } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';
import type { CapabilityData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import { useCollapsibleCards } from '@/components/collapsible-cards-context';

// Lean, presentational XmR (individuals) chart card (2026-07-08). Renders a
// CapabilityData series (one point per case) as a control chart + stat tiles.
// Shared by the touches-per-case and steps-per-case charts. Deliberately WITHOUT
// the event pickers / annotation inspector / PNG export that CapabilityChart
// carries — those stay there. `controls` is an optional slot for measure/mode
// toggles rendered under the header.
const THEME = { textSecondary: '#6b7280', grid: '#e5e7eb' };
const COLORS = { value: '#22c55e', failure: '#ef4444', neutral: '#3b82f6' };
const tooltipStyle = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#1f2937' },
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

export default function XmRChart({
  title, subtitle, valueLabel, data, loading, controls, fmtValue, info,
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
}) {
  const { t } = useLocale();
  const collapsible = useCollapsibleCards();
  const [open, setOpen] = useState(true);
  const fmt = fmtValue ?? ((v: number | null) => (v == null ? '—' : String(v)));
  const chartPoints = data ? data.points.map((p) => ({ ...p, value: p.leadTime })) : [];

  return (
    <div className="rounded-xl shadow-sm p-5 bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {info}
        <span className="flex-1" />
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
          <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.capabilityNoData')}</p>
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
                    <div className="rounded-lg shadow-md bg-white border border-gray-200 px-3 py-2 text-xs text-gray-700">
                      <div className="font-medium text-gray-900">#{pt.caseRef} · {new Date(pt.startedAt).toLocaleDateString()}</div>
                      <div>{valueLabel}: {fmt(pt.leadTime)}</div>
                    </div>
                  );
                }} />
                {/* extendDomain so a limit above the data max (common with few points,
                    e.g. UNPL) grows the Y axis instead of being discarded/clipped. */}
                {data.mean != null && <ReferenceLine y={data.mean} ifOverflow="extendDomain" stroke={THEME.textSecondary} strokeDasharray="5 4" label={{ value: t('dashboard.processAvg'), position: 'right', fill: THEME.textSecondary, fontSize: 10 }} />}
                {data.unpl != null && <ReferenceLine y={data.unpl} ifOverflow="extendDomain" stroke={COLORS.failure} strokeDasharray="5 4" label={{ value: t('dashboard.upperLimit'), position: 'right', fill: COLORS.failure, fontSize: 10 }} />}
                {data.lnpl != null && <ReferenceLine y={data.lnpl} ifOverflow="extendDomain" stroke={COLORS.failure} strokeDasharray="5 4" label={{ value: t('dashboard.lowerLimit'), position: 'right', fill: COLORS.failure, fontSize: 10 }} />}
                <Line
                  type="monotone"
                  dataKey="value"
                  name={valueLabel}
                  stroke={COLORS.neutral}
                  strokeWidth={2}
                  isAnimationActive={false}
                  activeDot={false}
                  dot={(props: { cx?: number; cy?: number; payload?: typeof data.points[number] }) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined || !payload) return <g key={`p-${cx}-${cy}`} />;
                    const special = payload.special;
                    return (
                      <g key={`p-${payload.caseId}`}>
                        <circle cx={cx} cy={cy} r={special ? 5 : 3.5} fill={special ? COLORS.failure : COLORS.neutral} stroke="#fff" strokeWidth={1} />
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
              <Card label={t('dashboard.capabilityCases')} value={data.n} />
              <Card label={t('dashboard.processAvg')} value={fmt(data.mean)} color={THEME.textSecondary} />
              <Card label={t('dashboard.capabilityMedian')} value={fmt(data.median)} />
              <Card label={t('dashboard.upperLimit')} value={fmt(data.unpl)} color={COLORS.failure} />
              <Card label={t('dashboard.lowerLimit')} value={fmt(data.lnpl)} color={COLORS.failure} />
              <Card label={t('dashboard.signals')} value={data.points.filter((p) => p.special).length} color={data.points.some((p) => p.special) ? COLORS.failure : COLORS.value} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
