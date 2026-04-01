'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, LabelList,
} from 'recharts';
import type { DashboardData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import { exportDashboardToPptx } from '@/lib/pptx-export';

const THEME = {
  text: '#1f2937',
  textSecondary: '#6b7280',
  accent: '#ac2c2d',
  grid: '#e5e7eb',
};

const COLORS = {
  value: '#22c55e',
  failure: '#ef4444',
  handling: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#14b8a6'],
};

const tooltipStyle = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: THEME.text },
  labelStyle: { color: THEME.text },
  itemStyle: { color: THEME.textSecondary },
};

type DateRange = 'all' | 'today' | '7d' | '30d';

export default function DashboardPage() {
  const params = useParams();
  const code = params.code as string;
  const { locale, t, tl } = useLocale();

  const [data, setData] = useState<DashboardData | null>(null);
  const [studyName, setStudyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [uploading, setUploading] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    let url = `/api/studies/${encodeURIComponent(code)}/dashboard`;
    const queryParams: string[] = [];

    if (dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      queryParams.push(`from=${today.toISOString()}`);
    } else if (dateRange === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      queryParams.push(`from=${d.toISOString()}`);
    } else if (dateRange === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      queryParams.push(`from=${d.toISOString()}`);
    }

    if (queryParams.length) url += '?' + queryParams.join('&');

    const res = await fetch(url);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [code, dateRange]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    fetch(`/api/studies/${encodeURIComponent(code)}`)
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s) setStudyName(s.name); });
  }, [code]);

  function handleExport() {
    let url = `/api/studies/${encodeURIComponent(code)}/entries/export`;
    if (dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      url += `?from=${today.toISOString()}`;
    } else if (dateRange === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      url += `?from=${d.toISOString()}`;
    } else if (dateRange === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      url += `?from=${d.toISOString()}`;
    }
    window.open(url, '_blank');
  }

  async function handleExportPptx() {
    if (!data) return;
    setExportingPptx(true);
    try {
      await exportDashboardToPptx(data, studyName || code, locale, dateRangeLabels[dateRange], tl);
    } catch (err) {
      console.error('PPTX export error:', err);
    }
    setExportingPptx(false);
  }

  function handleDownloadTemplate() {
    window.open(`/api/studies/${encodeURIComponent(code)}/entries/template`, '_blank');
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/import`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setUploadMessage({ type: 'error', text: t('dashboard.uploadError', { error: result.error || 'Unknown error' }) });
      } else {
        let msg = t('dashboard.uploadSuccess', { count: String(result.imported) });
        if (result.errors?.length > 0) {
          msg += ` (${result.errors.length} errors)`;
        }
        setUploadMessage({ type: 'success', text: msg });
        loadDashboard();
      }
    } catch {
      setUploadMessage({ type: 'error', text: t('dashboard.uploadError', { error: 'Network error' }) });
    }

    setUploading(false);
    e.target.value = '';
  }

  if (loading && !data) {
    return <div className="p-4 text-gray-500">{t('dashboard.loading')}</div>;
  }

  if (!data) {
    return <div className="p-4 text-red-600">{t('dashboard.loadFailed')}</div>;
  }

  const pieData = [
    { name: t('capture.value'), value: data.valueCount, color: COLORS.value },
    { name: t('capture.failure'), value: data.failureCount, color: COLORS.failure },
  ];

  const valuePercent = data.totalEntries > 0 ? Math.round((data.valueCount / data.totalEntries) * 100) : 0;
  const failurePercent = data.totalEntries > 0 ? Math.round((data.failureCount / data.totalEntries) * 100) : 0;

  const dateRangeLabels: Record<DateRange, string> = {
    all: t('dashboard.allTime'),
    today: t('dashboard.today'),
    '7d': t('dashboard.7days'),
    '30d': t('dashboard.30days'),
  };

  // Translate labels + add percentage for bar charts
  const totalDemandTypeCount = data.demandTypeCounts.reduce((s, d) => s + d.count, 0);
  const translatedDemandTypeCounts = data.demandTypeCounts.map(d => ({
    ...d, label: tl(d.label),
    pct: totalDemandTypeCount > 0 ? `${Math.round((d.count / totalDemandTypeCount) * 100)}%` : '0%',
  }));
  const translatedHandlingTypeCounts = data.handlingTypeCounts.map(d => ({ ...d, label: tl(d.label) }));
  const translatedContactMethodCounts = data.contactMethodCounts.map(d => ({ ...d, label: tl(d.label) }));
  const translatedHandlingByClassification = data.handlingByClassification.map(d => {
    const total = d.valueCount + d.failureCount;
    return {
      ...d, label: tl(d.label),
      valuePct: total > 0 ? `${Math.round((d.valueCount / total) * 100)}%` : '',
      failurePct: total > 0 ? `${Math.round((d.failureCount / total) * 100)}%` : '',
    };
  });
  const totalWmCount = data.whatMattersCounts.reduce((s, d) => s + d.count, 0);
  const translatedWhatMattersCounts = data.whatMattersCounts.map(d => ({
    ...d, label: tl(d.label),
    pct: totalWmCount > 0 ? `${Math.round((d.count / totalWmCount) * 100)}%` : '0%',
  }));

  const translatedPotByClassification = (data.pointOfTransactionByClassification || []).map(d => {
    const total = d.valueCount + d.failureCount;
    return {
      ...d, label: tl(d.label),
      valuePct: total > 0 ? `${Math.round((d.valueCount / total) * 100)}%` : '',
      failurePct: total > 0 ? `${Math.round((d.failureCount / total) * 100)}%` : '',
      total,
      totalPct: data.totalEntries > 0 ? `${Math.round((total / data.totalEntries) * 100)}%` : '0%',
    };
  });

  const tickStyle = { fontSize: 11, fill: THEME.textSecondary };

  return (
    <div className="pb-8">
      <div className="max-w-5xl mx-auto p-4 space-y-5">
        {/* Date range filter + export */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg p-1 bg-white border border-gray-200">
            {(['all', 'today', '7d', '30d'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  dateRange === range ? 'bg-[#ac2c2d] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {dateRangeLabels[range]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadTemplate} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
              {t('dashboard.downloadTemplate')}
            </button>
            <label className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? t('dashboard.uploading') : t('dashboard.uploadXlsx')}
              <input type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
            <button onClick={handleExport} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
              {t('dashboard.export')}
            </button>
            <button onClick={handleExportPptx} disabled={exportingPptx || !data || data.totalEntries === 0} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-[#ac2c2d] text-white hover:bg-[#8f2324] disabled:opacity-50 disabled:cursor-not-allowed">
              {exportingPptx ? '...' : t('dashboard.exportPptx')}
            </button>
          </div>
        </div>

        {uploadMessage && (
          <div className={`p-3 rounded-lg text-sm ${uploadMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {uploadMessage.text}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card label={t('dashboard.totalEntries')} value={data.totalEntries} />
          <Card label={t('dashboard.valueDemand')} value={`${valuePercent}%`} sub={`${data.valueCount} ${t('dashboard.entries')}`} color={COLORS.value} />
          <Card label={t('dashboard.failureDemand')} value={`${failurePercent}%`} sub={`${data.failureCount} ${t('dashboard.entries')}`} color={COLORS.failure} />
          <Card label={t('dashboard.perfect')} value={`${data.perfectPercentage}%`} sub={t('dashboard.perfectSub')} color="#22c55e" />
        </div>

        {/* Top metric: failure by original value demand */}
        {data.failuresByOriginalValueDemand && data.failuresByOriginalValueDemand.length > 0 && (
          <ChartCard title={t('dashboard.failureByValueTitle')}>
            <ResponsiveContainer width="100%" height={Math.max(200, data.failuresByOriginalValueDemand.length * 45)}>
              <BarChart data={data.failuresByOriginalValueDemand} layout="vertical" margin={{ left: 10, right: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: THEME.textSecondary, fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={140} tick={{ fill: THEME.text, fontSize: 12 }} tickFormatter={(v: string) => tl(v)} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill={COLORS.failure} radius={[0, 4, 4, 0]}
                  label={(props) => {
                    const total = data.failuresByOriginalValueDemand.reduce((s, d) => s + d.count, 0);
                    const pct = total > 0 ? Math.round(((props.value as number) / total) * 100) : 0;
                    return `${props.value} (${pct}%)`;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {data.totalEntries === 0 ? (
          <div className="rounded-xl p-8 text-center bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
            {t('dashboard.noEntries')}
          </div>
        ) : (
          <>
            {/* Row 1: Value/Failure pie + Top demand types */}
            <div className="grid md:grid-cols-2 gap-4">
              <ChartCard title={t('dashboard.valueVsFailure')}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="value"
                      label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t('dashboard.top10')}>
                <ResponsiveContainer width="100%" height={Math.max(250, translatedDemandTypeCounts.length * 32 + 40)}>
                  <BarChart data={translatedDemandTypeCounts} layout="vertical" margin={{ left: 10, right: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                    <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {translatedDemandTypeCounts.map((d, i) => (
                        <Cell key={i} fill={d.category === 'failure' ? COLORS.failure : '#3b82f6'} />
                      ))}
                      <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 10 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 2: Handling pie + Handling by classification */}
            <div className="grid md:grid-cols-2 gap-4">
              <ChartCard title={t('dashboard.handlingTitle')}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={translatedHandlingTypeCounts} cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="count" nameKey="label"
                      label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {translatedHandlingTypeCounts.map((_, i) => (<Cell key={i} fill={COLORS.handling[i % COLORS.handling.length]} />))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t('dashboard.handlingByClass')}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={translatedHandlingByClassification} margin={{ left: 10, right: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: THEME.textSecondary }} angle={-20} textAnchor="end" interval={0} height={50} />
                    <YAxis allowDecimals={false} tick={tickStyle} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ color: THEME.textSecondary, fontSize: 12 }} />
                    <Bar dataKey="valueCount" name={t('capture.value')} fill={COLORS.value} stackId="a" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="valuePct" position="center" style={{ fill: '#fff', fontSize: 9, fontWeight: 600 }} />
                    </Bar>
                    <Bar dataKey="failureCount" name={t('capture.failure')} fill={COLORS.failure} stackId="a">
                      <LabelList dataKey="failurePct" position="center" style={{ fill: '#fff', fontSize: 9, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Contact methods + What Matters */}
            <div className="grid md:grid-cols-2 gap-4">
              {data.contactMethodCounts.length > 0 && (
                <ChartCard title={t('dashboard.contactMethods')}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={translatedContactMethodCounts} cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="count" nameKey="label"
                        label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {translatedContactMethodCounts.map((_, i) => (<Cell key={i} fill={COLORS.handling[i % COLORS.handling.length]} />))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {data.whatMattersCounts.length > 0 && (
                <ChartCard title={t('dashboard.whatMatters')}>
                  <ResponsiveContainer width="100%" height={Math.max(250, translatedWhatMattersCounts.length * 32 + 40)}>
                    <BarChart data={translatedWhatMattersCounts} layout="vertical" margin={{ left: 10, right: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 10 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>

            {/* Point of transaction by classification */}
            {translatedPotByClassification.length > 0 && (
              <ChartCard title={t('dashboard.pointOfTransaction')}>
                <ResponsiveContainer width="100%" height={Math.max(200, translatedPotByClassification.length * 50 + 40)}>
                  <BarChart data={translatedPotByClassification} layout="vertical" margin={{ left: 10, right: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                    <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11, fill: THEME.text }} interval={0} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ color: THEME.textSecondary, fontSize: 12 }} />
                    <Bar dataKey="valueCount" name={t('capture.value')} fill={COLORS.value} stackId="a" radius={[0, 0, 0, 0]}>
                      <LabelList dataKey="valuePct" position="center" style={{ fill: '#fff', fontSize: 10, fontWeight: 600 }} />
                    </Bar>
                    <Bar dataKey="failureCount" name={t('capture.failure')} fill={COLORS.failure} stackId="a" radius={[0, 4, 4, 0]}
                      label={(props) => {
                        const item = translatedPotByClassification[props.index as number];
                        if (!item) return '';
                        return `${item.total} (${item.totalPct})`;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Demand over time */}
            {data.demandOverTime.length > 1 && (
              <ChartCard title={t('dashboard.overTime')}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.demandOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis dataKey="date" tick={tickStyle} />
                    <YAxis allowDecimals={false} tick={tickStyle} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ color: THEME.textSecondary }} />
                    <Line type="monotone" dataKey="valueCount" name={t('capture.value')} stroke={COLORS.value} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="failureCount" name={t('capture.failure')} stroke={COLORS.failure} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Failure causes */}
            {data.failureCauses.length > 0 && (
              <ChartCard title={t('dashboard.failureCauses')}>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.failureCauses.map((fc, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded bg-red-50">
                      <span className="text-sm truncate mr-2 text-gray-700">{fc.cause}</span>
                      <span className="text-sm font-medium shrink-0 text-red-700">{fc.count}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

            {/* What matters - free text notes */}
            {data.whatMattersNotes && data.whatMattersNotes.length > 0 && (
              <ChartCard title={t('dashboard.whatMattersNotes')}>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {data.whatMattersNotes.map((note, i) => (
                    <div key={i} className="py-2 px-3 rounded bg-gray-50 border border-gray-100">
                      <p className="text-sm text-gray-700">{note.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{note.date}</p>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl shadow-sm p-4 bg-white border border-gray-200">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: color || '#1f2937' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5 text-gray-400">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl shadow-sm p-5 bg-white border border-gray-200 overflow-hidden">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">{title}</h3>
      {children}
    </div>
  );
}
