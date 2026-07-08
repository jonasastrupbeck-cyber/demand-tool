'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocale } from '@/lib/locale-context';
import { useCollapsibleCards } from '@/components/collapsible-cards-context';
import InfoPopover from '@/components/InfoPopover';
import PillMultiSelect from '@/components/PillMultiSelect';

const THEME = { text: '#1f2937', textSecondary: '#6b7280', grid: '#e5e7eb' };
const NEUTRAL = ['#3b82f6', '#60a5fa', '#93c5fd', '#6b7280', '#9ca3af', '#475569', '#94a3b8', '#64748b'];
const tooltipStyle = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: THEME.text },
  labelStyle: { color: THEME.text },
  itemStyle: { color: THEME.textSecondary },
};

type Row = { label: string; count: number };

// Capability-of-Response distribution across flow touches (2026-07-09), with a
// multi-select work-classification filter (value / sequence / failure / failure
// demand). Scoped by the dashboard's value-demand filter + date range. Fetches its
// own endpoint so toggling the filter doesn't refetch the whole dashboard.
export default function CorDistributionChart({
  code, dateFrom, dateTo, valueDemands,
}: {
  code: string;
  dateFrom?: string;
  dateTo?: string;
  valueDemands?: string[];
}) {
  const { t, tl } = useLocale();
  const collapsible = useCollapsibleCards();
  const [open, setOpen] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const qp = new URLSearchParams();
    if (dateFrom) qp.set('from', dateFrom);
    if (dateTo) qp.set('to', dateTo);
    if (valueDemands && valueDemands.length) qp.set('valueDemands', valueDemands.join(','));
    if (tags.length) qp.set('tags', tags.join(','));
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/cor-distribution?${qp}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRows(Array.isArray(d) ? d : []));
  }, [code, dateFrom, dateTo, valueDemands, tags]);

  const tagOptions = [
    { value: 'value', label: t('capture.value') },
    { value: 'sequence', label: t('capture.classificationWorkSequence') },
    { value: 'failure', label: t('capture.failure') },
    { value: 'failure_demand', label: t('capture.workBlockTagFailureDemand') },
  ];
  const data = (rows ?? []).map((d) => ({ ...d, label: tl(d.label) }));

  return (
    <div className="rounded-xl shadow-sm bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-gray-700">{t('dashboard.corDistributionTitle')}</h3>
        <InfoPopover label={t('dashboard.corDistributionTitle')}>{t('dashboard.calcCor')}</InfoPopover>
        <span className="flex-1" />
        {collapsible && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Collapse' : 'Expand'} className="shrink-0 text-gray-400 hover:text-gray-600 text-xs leading-none px-1 py-0.5 transition-colors">
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>
      <div className={collapsible && !open ? 'max-h-0 overflow-hidden' : ''}>
        <div className="px-5 pt-1 pb-5">
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 px-0.5">{t('dashboard.corWorkFilter')}</p>
            <PillMultiSelect
              ariaLabel={t('dashboard.corWorkFilter')}
              value={tags}
              onChange={setTags}
              allLabel={t('dashboard.scopeAll')}
              options={tagOptions}
            />
          </div>
          {data.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('dashboard.capabilityNoData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%" outerRadius={80} innerRadius={32}
                  dataKey="count" nameKey="label"
                  label={(props: { percent?: number }) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {data.map((_, i) => (<Cell key={i} fill={NEUTRAL[i % NEUTRAL.length]} />))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
