/* Dashboard – demand / work / overview tabs */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, LabelList, Sankey,
} from 'recharts';
import type { NodeProps, LinkProps } from 'recharts/types/chart/Sankey';
import type { DashboardData } from '@/types';
import { useLocale } from '@/lib/locale-context';
import { exportDashboardToPptx } from '@/lib/pptx-export';
import EntryEditModal, { type EntryEditModalStudy } from '@/components/EntryEditModal';

const THEME = {
  text: '#1f2937',
  textSecondary: '#6b7280',
  accent: '#ac2c2d',
  grid: '#e5e7eb',
};

const COLORS = {
  value: '#22c55e',
  failure: '#ef4444',
  // Blue-to-grey shades for non-classification data
  neutral: ['#3b82f6', '#60a5fa', '#93c5fd', '#6b7280', '#9ca3af', '#475569', '#94a3b8', '#64748b'],
};

const tooltipStyle = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: THEME.text },
  labelStyle: { color: THEME.text },
  itemStyle: { color: THEME.textSecondary },
};

type DateRange = 'all' | 'today' | '7d' | '30d' | 'custom';

type DashboardView = 'demand' | 'work' | 'overview';

export default function DashboardPage() {
  const params = useParams();
  const code = params.code as string;
  const { locale, t, tl } = useLocale();

  const [data, setData] = useState<DashboardData | null>(null);
  const [studyName, setStudyName] = useState('');
  const [studyPurpose, setStudyPurpose] = useState('');
  const [workTrackingEnabled, setWorkTrackingEnabled] = useState(false);
  const [demandTypesEnabled, setDemandTypesEnabled] = useState(false);
  const [activeLayer, setActiveLayer] = useState(5);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dashboardView, setDashboardView] = useState<DashboardView>('demand');
  const [uploading, setUploading] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<{ sourceLabel: string; targetLabel: string; sourceName: string; targetName: string; count: number } | null>(null);
  const [flowCauses, setFlowCauses] = useState<Array<{ cause: string; count: number }> | null>(null);
  const [flowCausesLoading, setFlowCausesLoading] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [entries, setEntries] = useState<Array<{ id: string; verbatim: string; classification: string; createdAt: string; demandTypeId: string | null; entryType: string; collectorName: string | null }>>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entryFilter, setEntryFilter] = useState('');
  const [demandTypeMap, setDemandTypeMap] = useState<Map<string, string>>(new Map());
  const [notesGroupBy, setNotesGroupBy] = useState<'date' | 'type'>('date');
  const [fullStudy, setFullStudy] = useState<EntryEditModalStudy | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const getDateRangeParams = useCallback((): { from?: string; to?: string } => {
    if (dateRange === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return { from: today.toISOString() };
    } else if (dateRange === '7d') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return { from: d.toISOString() };
    } else if (dateRange === '30d') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      return { from: d.toISOString() };
    } else if (dateRange === 'custom') {
      const params: { from?: string; to?: string } = {};
      if (customFrom) params.from = new Date(customFrom).toISOString();
      if (customTo) {
        const toDate = new Date(customTo); toDate.setHours(23, 59, 59, 999);
        params.to = toDate.toISOString();
      }
      return params;
    }
    return {};
  }, [dateRange, customFrom, customTo]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    let url = `/api/studies/${encodeURIComponent(code)}/dashboard`;
    const range = getDateRangeParams();
    const queryParams: string[] = [];
    if (range.from) queryParams.push(`from=${range.from}`);
    if (range.to) queryParams.push(`to=${range.to}`);
    if (queryParams.length) url += '?' + queryParams.join('&');

    const res = await fetch(url);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [code, getDateRangeParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    fetch(`/api/studies/${encodeURIComponent(code)}`)
      .then(r => r.ok ? r.json() : null)
      .then(s => {
        if (!s) return;
        setStudyName(s.name);
        setStudyPurpose(s.purpose || '');
        setWorkTrackingEnabled(s.workTrackingEnabled);
        setDemandTypesEnabled(s.demandTypesEnabled ?? false);
        // Derive effective layer from the capture toggles so the dashboard
        // gates stay in sync with what the team chose to capture.
        let effective = 1;
        if (s.classificationEnabled) effective = 2;
        if (s.handlingEnabled) effective = Math.max(effective, 3);
        if (s.valueLinkingEnabled) effective = Math.max(effective, 4);
        if ((s.whatMattersTypes?.length || 0) > 0) effective = Math.max(effective, 5);
        setActiveLayer(effective);
        setFullStudy(s as EntryEditModalStudy);
      });
  }, [code]);

  // Fetch system conditions when a Sankey flow link is clicked
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedFlow) { setFlowCauses(null); return; }
    setFlowCausesLoading(true);
    const qp = new URLSearchParams({
      source: selectedFlow.sourceLabel,
      target: selectedFlow.targetLabel,
    });
    const range = getDateRangeParams();
    if (range.from) qp.set('from', range.from);
    if (range.to) qp.set('to', range.to);
    fetch(`/api/studies/${encodeURIComponent(code)}/dashboard/flow-causes?${qp}`)
      .then(r => r.ok ? r.json() : { causes: [] })
      .then(d => setFlowCauses(d.causes))
      .finally(() => setFlowCausesLoading(false));
  }, [selectedFlow, code, getDateRangeParams]);

  // Fetch raw entries and demand type map on demand
  useEffect(() => {
    if (!showEntries) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntriesLoading(true);
    Promise.all([
      fetch(`/api/studies/${encodeURIComponent(code)}/entries`).then(r => r.ok ? r.json() : { entries: [] }),
      fetch(`/api/studies/${encodeURIComponent(code)}/demand-types`).then(r => r.ok ? r.json() : []),
    ])
      .then(([entriesData, types]) => {
        setEntries(entriesData.entries || []);
        const map = new Map<string, string>();
        for (const dt of types) map.set(dt.id, dt.label);
        setDemandTypeMap(map);
      })
      .finally(() => setEntriesLoading(false));
  }, [showEntries, code]);

  function handleExport() {
    let url = `/api/studies/${encodeURIComponent(code)}/entries/export`;
    const range = getDateRangeParams();
    const qp: string[] = [];
    if (range.from) qp.push(`from=${range.from}`);
    if (range.to) qp.push(`to=${range.to}`);
    if (qp.length) url += '?' + qp.join('&');
    window.open(url, '_blank');
  }

  async function handleExportPptx() {
    if (!data) return;
    setExportingPptx(true);
    try {
      const rangeLabel = dateRange === 'custom' && (customFrom || customTo)
        ? [customFrom, customTo].filter(Boolean).join(' – ')
        : dateRangeLabels[dateRange];
      await exportDashboardToPptx(data, studyName || code, locale, rangeLabel, tl, activeLayer, demandTypesEnabled);
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
    custom: t('dashboard.custom'),
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
  const translatedWmByClassification = (data.whatMattersByClassification || []).map(d => {
    const total = d.valueCount + d.failureCount;
    return {
      ...d, label: tl(d.label),
      valuePct: total > 0 ? `${Math.round((d.valueCount / total) * 100)}%` : '',
      failurePct: total > 0 ? `${Math.round((d.failureCount / total) * 100)}%` : '',
    };
  });

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

  const notesByDate = new Map<string, string[]>();
  const notesByDemandType = new Map<string, Array<{ text: string; date: string; classification: string | null }>>();
  if (data.whatMattersNotes) {
    for (const note of data.whatMattersNotes) {
      const existing = notesByDate.get(note.date) || [];
      existing.push(note.text);
      notesByDate.set(note.date, existing);
      // Group by demand type label
      const groupKey = note.demandTypeLabel || '_unclassified';
      const dtGroup = notesByDemandType.get(groupKey) || [];
      dtGroup.push({ text: note.text, date: note.date, classification: note.classification });
      notesByDemandType.set(groupKey, dtGroup);
    }
  }

  const tickStyle = { fontSize: 11, fill: THEME.textSecondary };

  return (
    <div className="pb-8">
      <div className="max-w-5xl mx-auto p-4 space-y-5">
        {/* Purpose statement */}
        {studyPurpose && (
          <div className="px-4 py-3 rounded-xl bg-white border border-gray-200">
            <p className="text-xs font-medium text-gray-400 mb-0.5">{t('dashboard.purpose')}</p>
            <p className="text-sm text-gray-800 italic">{studyPurpose}</p>
          </div>
        )}

        {/* Date range filter + export */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg p-1 bg-white border border-gray-200">
              {(['all', 'today', '7d', '30d', 'custom'] as DateRange[]).map((range) => (
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
            {dateRange === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-700"
                />
                <span className="text-gray-400 text-sm">–</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-700"
                />
              </div>
            )}
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

        {/* Dashboard view tabs (only when work tracking enabled and has work data) */}
        {workTrackingEnabled && data.workCount > 0 && (
          <div>
            <div className="flex gap-1 rounded-lg p-1 bg-white border border-gray-200 w-fit">
              {(['demand', 'work', 'overview'] as DashboardView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setDashboardView(view)}
                  className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                    dashboardView === view ? 'bg-[#ac2c2d] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {view === 'demand' ? t('dashboard.demandTab') : view === 'work' ? t('dashboard.workTab') : t('dashboard.overview')}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {dashboardView === 'demand' ? t('dashboard.demandTabHelp') :
               dashboardView === 'work' ? t('dashboard.workTabHelp') :
               t('dashboard.overviewTabHelp')}
            </p>
          </div>
        )}

        {/* Summary cards */}
        {dashboardView === 'demand' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card label={t('dashboard.totalEntries')} value={data.totalEntries} />
          {activeLayer >= 2 && <Card label={t('dashboard.valueDemand')} value={`${valuePercent}%`} sub={`${data.valueCount} ${t('dashboard.entries')}`} color={COLORS.value} />}
          {activeLayer >= 2 && <Card label={t('dashboard.failureDemand')} value={`${failurePercent}%`} sub={`${data.failureCount} ${t('dashboard.entries')}`} color={COLORS.failure} />}
          {activeLayer >= 3 && <Card label={t('dashboard.perfect')} value={`${data.perfectPercentage}%`} sub={t('dashboard.perfectSub')} color="#22c55e" />}
          {activeLayer >= 2 && data.unknownCount > 0 && (
            <Card label={t('dashboard.unknownEntries')} value={data.unknownCount} color="#f59e0b" />
          )}
        </div>
        )}

        {/* ── DEMAND VIEW ── */}
        {dashboardView === 'demand' && data.totalEntries === 0 && (
          <div className="rounded-xl p-8 text-center bg-white border border-gray-200">
            <p className="text-lg font-semibold text-gray-700 mb-2">{t('dashboard.noEntries')}</p>
            <p className="text-sm text-gray-500">{t('dashboard.noEntriesHint')}</p>
          </div>
        )}
        {dashboardView === 'demand' && data.totalEntries > 0 && (
          <>
            {/* Value/Failure pie (Layer 2+) */}
            {activeLayer >= 2 && <ChartCard title={t('dashboard.valueVsFailure')}>
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
            </ChartCard>}

            {/* Top 10 Demand Types (when demand types enabled) */}
            {demandTypesEnabled && <ChartCard title={t('dashboard.top10')}>
              <ResponsiveContainer width="100%" height={Math.max(300, translatedDemandTypeCounts.length * 40 + 40)}>
                <BarChart data={translatedDemandTypeCounts} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                  <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                  <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 18) + '…' : v} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill={COLORS.value} radius={[0, 4, 4, 0]}>
                    {translatedDemandTypeCounts.map((d, i) => (
                      <Cell key={i} fill={d.category === 'failure' ? COLORS.failure : COLORS.value} />
                    ))}
                    <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>}

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

            {/* Handling pie + Handling by classification (Layer 3+) */}
            {activeLayer >= 3 && <div className="grid md:grid-cols-2 gap-4">
              <ChartCard title={t('dashboard.handlingTitle')}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={translatedHandlingTypeCounts} cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="count" nameKey="label"
                      label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {translatedHandlingTypeCounts.map((_, i) => (<Cell key={i} fill={COLORS.neutral[i % COLORS.neutral.length]} />))}
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
            </div>}

            {/* Failures by original value demand type */}
            {activeLayer >= 2 && data.failuresByOriginalValueDemand && data.failuresByOriginalValueDemand.length > 0 && (
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

            {/* Failure Flow Sankey */}
            {activeLayer >= 2 && (() => {
              const flowLinks = data.failureFlowLinks || [];
              if (flowLinks.length === 0) return null;
              const sankeyData = buildSankeyData(flowLinks, tl);
              const totalNodes = sankeyData.nodes.length;
              const sc = sankeyData.sourceCount;
              const meta = sankeyData.linkMeta;
              return (
                <ChartCard title={t('dashboard.failureFlow')}>
                  <p className="text-xs text-gray-500 mb-2 -mt-1">{t('dashboard.flowClickHint')}</p>
                  <ResponsiveContainer width="100%" height={Math.max(300, totalNodes * 35)}>
                    <Sankey
                      data={sankeyData}
                      nodePadding={24}
                      nodeWidth={10}
                      linkCurvature={0.5}
                      margin={{ top: 10, right: 160, bottom: 10, left: 160 }}
                      node={(props: NodeProps) => <SankeyNode {...props} sourceCount={sc} />}
                      link={(props: LinkProps) => {
                        const m = meta.get(props.index);
                        return <SankeyLink {...props} onClick={m ? () => setSelectedFlow(m) : undefined} />;
                      }}
                    >
                      <Tooltip />
                    </Sankey>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {/* Lifecycle Sankey + failure-by-stage */}
            {data.lifecycleEnabled && (data.lifecycleByStageAndDemandType?.length ?? 0) > 0 && (() => {
              const rows = data.lifecycleByStageAndDemandType;
              const stageOrder: string[] = [];
              const stageSeen = new Set<string>();
              for (const r of rows) {
                if (!stageSeen.has(r.stageLabel)) { stageSeen.add(r.stageLabel); stageOrder.push(r.stageLabel); }
              }
              // Type nodes grouped by stage (in stage order), then value-before-failure
              // within each stage. Shared types — those that appear under more than one
              // stage — are placed with their first-seen stage. This keeps each stage's
              // outflows as a contiguous block on the right side of the Sankey so the
              // value/failure grouping for that stage is visually coherent.
              // (Feedback 2026-04-16: previous ordering separated all value from all
              // failure globally, which made links cross unnecessarily.)
              const typeOrder: Array<{ label: string; category: 'value' | 'failure' }> = [];
              const typeSeen = new Set<string>();
              for (const stage of stageOrder) {
                for (const cat of ['value', 'failure'] as const) {
                  for (const r of rows) {
                    if (r.stageLabel === stage && r.demandTypeCategory === cat && !typeSeen.has(r.demandTypeLabel)) {
                      typeSeen.add(r.demandTypeLabel);
                      typeOrder.push({ label: r.demandTypeLabel, category: cat });
                    }
                  }
                }
              }
              const nodes = [
                ...stageOrder.map(s => ({ name: s })),
                ...typeOrder.map(tObj => ({ name: tl(tObj.label) })),
              ];
              const stageIdx = new Map(stageOrder.map((s, i) => [s, i]));
              const typeIdx = new Map(typeOrder.map((tObj, i) => [tObj.label, i + stageOrder.length]));
              const links = rows.map(r => ({
                source: stageIdx.get(r.stageLabel)!,
                target: typeIdx.get(r.demandTypeLabel)!,
                value: r.count,
              }));
              const linkCategory = rows.map(r => r.demandTypeCategory);
              // Node category map: stages default to 'stage' (green), types use their category
              const nodeCategory: Array<'stage' | 'value' | 'failure'> = [
                ...stageOrder.map(() => 'stage' as const),
                ...typeOrder.map(tObj => tObj.category),
              ];
              return (
                <ChartCard title={t('dashboard.lifecycleSankey')}>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-2 -mt-1">
                    <span className="inline-flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.value }} />{tl('Value demand')}</span>
                    <span className="inline-flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.failure }} />{tl('Failure demand')}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(280, nodes.length * 32)}>
                    <Sankey
                      data={{ nodes, links }}
                      nodePadding={24}
                      nodeWidth={10}
                      linkCurvature={0.5}
                      margin={{ top: 10, right: 180, bottom: 10, left: 160 }}
                      node={(props: NodeProps) => {
                        const cat = nodeCategory[props.index];
                        const fill = cat === 'stage' ? '#6366f1' : cat === 'value' ? COLORS.value : COLORS.failure;
                        return <SankeyNode {...props} sourceCount={stageOrder.length} fillOverride={fill} />;
                      }}
                      link={(props: LinkProps) => {
                        const { onClick: _omit, ...rest } = props;
                        void _omit;
                        const stroke = linkCategory[props.index] === 'value' ? COLORS.value : COLORS.failure;
                        return <SankeyLink {...rest} stroke={stroke} />;
                      }}
                    >
                      <Tooltip />
                    </Sankey>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {data.lifecycleEnabled && (data.lifecycleFailureByStage?.length ?? 0) > 0 && (
              <ChartCard title={t('dashboard.lifecycleByStage')}>
                <ResponsiveContainer width="100%" height={Math.max(220, data.lifecycleFailureByStage.length * 38 + 40)}>
                  <BarChart data={data.lifecycleFailureByStage} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                    <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                    <YAxis type="category" dataKey="stageLabel" width={120} tick={{ fontSize: 11, fill: THEME.textSecondary }} interval={0} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill={COLORS.failure} radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="count" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

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
                        {translatedContactMethodCounts.map((_, i) => (<Cell key={i} fill={COLORS.neutral[i % COLORS.neutral.length]} />))}
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
                      <Bar dataKey="count" fill="#60a5fa" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 10 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>

            {/* Life Problems Being Solved (Phase 3) — demand-only, layer 2+ */}
            {activeLayer >= 2 && data.lifeProblemCounts.length > 0 && (() => {
              const translated = data.lifeProblemCounts.map(d => ({ ...d, label: tl(d.label) }));
              const total = translated.reduce((s, r) => s + r.count, 0);
              const withPct = translated.map(r => ({
                ...r,
                pct: total > 0 ? `${Math.round((r.count / total) * 100)}%` : '0%',
              }));
              return (
                <ChartCard title={t('dashboard.lifeProblems')}>
                  <ResponsiveContainer width="100%" height={Math.max(250, withPct.length * 40 + 40)}>
                    <BarChart data={withPct} layout="vertical" margin={{ left: 10, right: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 26) + '…' : v} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill="#60a5fa" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {/* What matters by classification (Layer 5+) */}
            {activeLayer >= 5 && translatedWmByClassification.length > 0 && (
              <ChartCard title={t('dashboard.whatMattersByClass')}>
                <ResponsiveContainer width="100%" height={Math.max(250, translatedWmByClassification.length * 50 + 40)}>
                  <BarChart data={translatedWmByClassification} margin={{ left: 10, right: 10, bottom: 20 }}>
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
            )}

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
                    >
                      <LabelList dataKey="failurePct" position="center" style={{ fill: '#fff', fontSize: 10, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Failure causes bar chart (Layer 2+) */}
            {activeLayer >= 2 && data.failureCauses.length > 0 && (() => {
              const top10Causes = data.failureCauses.slice(0, 10);
              const totalCauses = top10Causes.reduce((s, fc) => s + fc.count, 0);
              const causesWithPct = top10Causes.map(fc => ({
                ...fc,
                pct: totalCauses > 0 ? `${Math.round((fc.count / totalCauses) * 100)}%` : '0%',
              }));
              return (
                <ChartCard title={t('dashboard.failureCauses')}>
                  <ResponsiveContainer width="100%" height={Math.max(250, causesWithPct.length * 40 + 40)}>
                    <BarChart data={causesWithPct} layout="vertical" margin={{ left: 10, right: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="cause" width={180} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 26) + '…' : v} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill={COLORS.failure} radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {/* Helping conditions bar chart (Layer 2+) — mirror of Failure Causes filtered to dimension = 'helps' */}
            {activeLayer >= 2 && data.helpingConditions.length > 0 && (() => {
              const top10 = data.helpingConditions.slice(0, 10);
              const total = top10.reduce((s, fc) => s + fc.count, 0);
              const withPct = top10.map(fc => ({
                ...fc,
                pct: total > 0 ? `${Math.round((fc.count / total) * 100)}%` : '0%',
              }));
              return (
                <ChartCard title={t('dashboard.helpingConditions')}>
                  <ResponsiveContainer width="100%" height={Math.max(250, withPct.length * 40 + 40)}>
                    <BarChart data={withPct} layout="vertical" margin={{ left: 10, right: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                      <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                      <YAxis type="category" dataKey="cause" width={180} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 26) + '…' : v} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill={COLORS.value} radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}

            {/* What matters - word cloud */}
            {notesByDate.size > 0 && (() => {
              const themes = extractThemes(data.whatMattersNotes.map(n => n.text));
              if (themes.length === 0) return null;
              const maxCount = themes[0].count;
              const minCount = themes[themes.length - 1].count;
              const range = Math.max(maxCount - minCount, 1);
              // Shuffle for visual variety (deterministic based on term)
              const shuffled = [...themes].sort((a, b) => {
                const ha = Array.from(a.term).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
                const hb = Array.from(b.term).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
                return ha - hb;
              });
              return (
                <ChartCard title={t('dashboard.whatMattersThemes')}>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 py-3">
                    {shuffled.map(({ term, count }) => {
                      const t01 = (count - minCount) / range; // 0–1 normalized
                      const fontSize = 12 + t01 * 14; // 12px–26px
                      const opacity = 0.45 + t01 * 0.55; // 0.45–1.0
                      const weight = t01 > 0.5 ? 700 : t01 > 0.2 ? 600 : 400;
                      return (
                        <span
                          key={term}
                          title={`${count}×`}
                          style={{ fontSize: `${fontSize}px`, fontWeight: weight, opacity, color: '#16a34a', lineHeight: 1.3 }}
                        >
                          {term}
                        </span>
                      );
                    })}
                  </div>
                </ChartCard>
              );
            })()}

            {/* What matters - free text notes */}
            {notesByDate.size > 0 && (
              <ChartCard title={`${t('dashboard.whatMattersNotes')} (${data.whatMattersNotes.length})`}>
                {/* Grouping toggle */}
                {demandTypesEnabled && notesByDemandType.size > 1 && (
                  <div className="flex gap-1 mb-3">
                    <button
                      onClick={() => setNotesGroupBy('date')}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${notesGroupBy === 'date' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {t('dashboard.groupByDate')}
                    </button>
                    <button
                      onClick={() => setNotesGroupBy('type')}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${notesGroupBy === 'type' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {t('dashboard.groupByType')}
                    </button>
                  </div>
                )}
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {notesGroupBy === 'date' ? (
                    [...notesByDate.entries()].map(([date, notes]) => (
                      <details key={date} open>
                        <summary className="cursor-pointer text-xs font-medium text-gray-500 py-1.5 flex items-center gap-1 select-none">
                          {date} <span className="text-gray-400">({notes.length})</span>
                        </summary>
                        <div className="space-y-1.5 pl-2 pb-2">
                          {notes.map((text, i) => (
                            <div key={i} className="py-1.5 px-3 rounded bg-gray-50 border border-gray-100">
                              <p className="text-sm text-gray-700">{text}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))
                  ) : (
                    [...notesByDemandType.entries()]
                      .sort((a, b) => b[1].length - a[1].length)
                      .map(([label, notes]) => {
                        const dt = data.demandTypeCounts.find(d => d.label === label);
                        const colorCls = dt?.category === 'value' ? 'text-green-600' : dt?.category === 'failure' ? 'text-red-600' : 'text-gray-500';
                        const displayLabel = label === '_unclassified' ? t('dashboard.unclassified') : tl(label);
                        return (
                          <details key={label} open>
                            <summary className={`cursor-pointer text-xs font-medium py-1.5 flex items-center gap-1 select-none ${colorCls}`}>
                              {displayLabel} <span className="text-gray-400">({notes.length})</span>
                            </summary>
                            <div className="space-y-1.5 pl-2 pb-2">
                              {notes.map((n, i) => (
                                <div key={i} className="py-1.5 px-3 rounded bg-gray-50 border border-gray-100">
                                  <p className="text-sm text-gray-700">{n.text}</p>
                                  <span className="text-xs text-gray-400">{n.date}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        );
                      })
                  )}
                </div>
              </ChartCard>
            )}

          </>
        )}

        {/* ── WORK VIEW ── */}
        {dashboardView === 'work' && (
          <>
            {/* Work summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card label={t('dashboard.workEntries')} value={data.workCount} />
              <Card label={t('dashboard.valueWorkPct')} value={data.workCount > 0 ? `${Math.round((data.workValueCount / data.workCount) * 100)}%` : '0%'} sub={`${data.workValueCount} ${t('dashboard.entries')}`} color={COLORS.value} />
              <Card label={t('dashboard.failureWorkPct')} value={data.workCount > 0 ? `${Math.round((data.workFailureCount / data.workCount) * 100)}%` : '0%'} sub={`${data.workFailureCount} ${t('dashboard.entries')}`} color={COLORS.failure} />
              {data.workUnknownCount > 0 && (
                <Card label={t('dashboard.unknownEntries')} value={data.workUnknownCount} color="#f59e0b" />
              )}
            </div>

            {data.workCount === 0 ? (
              <div className="rounded-xl p-8 text-center bg-white border border-gray-200 text-gray-600">
                {t('dashboard.noEntries')}
              </div>
            ) : (
              <>
                {/* Work value/failure pie */}
                <ChartCard title={t('dashboard.workAnalysis')}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('capture.value'), value: data.workValueCount },
                          { name: t('capture.failure'), value: data.workFailureCount },
                          ...(data.workUnknownCount > 0 ? [{ name: '?', value: data.workUnknownCount }] : []),
                        ]}
                        cx="50%" cy="50%" outerRadius={75} innerRadius={30} dataKey="value"
                        label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {[COLORS.value, COLORS.failure, '#f59e0b'].slice(0, data.workUnknownCount > 0 ? 3 : 2).map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Work types by classification — stacked bar */}
                {data.workTypesByClassification && data.workTypesByClassification.length > 0 && (() => {
                  const translated = data.workTypesByClassification.map(d => ({
                    label: tl(d.label),
                    [t('capture.value')]: d.valueCount,
                    [t('capture.failure')]: d.failureCount,
                    total: d.valueCount + d.failureCount,
                  }));
                  return (
                    <ChartCard title={t('dashboard.workTypesByClass')}>
                      <ResponsiveContainer width="100%" height={Math.max(220, translated.length * 45 + 40)}>
                        <BarChart data={translated} layout="vertical" margin={{ left: 10, right: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                          <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                          <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 23) + '…' : v} />
                          <Tooltip {...tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 12, color: THEME.textSecondary }} />
                          <Bar dataKey={t('capture.value')} stackId="a" fill={COLORS.value} radius={[0, 0, 0, 0]} />
                          <Bar dataKey={t('capture.failure')} stackId="a" fill={COLORS.failure} radius={[0, 4, 4, 0]}>
                            <LabelList dataKey="total" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  );
                })()}

                {/* Work types total bar chart */}
                {data.workTypeCounts.length > 0 && (
                  <ChartCard title={t('dashboard.workTypes')}>
                    <ResponsiveContainer width="100%" height={Math.max(200, data.workTypeCounts.length * 40 + 40)}>
                      <BarChart data={(() => {
                        const totalWork = data.workTypeCounts.reduce((s, d) => s + d.count, 0);
                        return data.workTypeCounts.map(d => ({
                          ...d,
                          label: tl(d.label),
                          pct: totalWork > 0 ? `${Math.round((d.count / totalWork) * 100)}%` : '0%',
                        }));
                      })()} layout="vertical" margin={{ left: 10, right: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} />
                        <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                        <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 10, fill: THEME.textSecondary }} interval={0} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 23) + '…' : v} />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="pct" position="right" style={{ fill: THEME.textSecondary, fontSize: 11 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Work over time */}
                {data.workOverTime.length > 1 && (
                  <ChartCard title={t('dashboard.workOverTime')}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.workOverTime}>
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
              </>
            )}
          </>
        )}

        {/* ── OVERVIEW VIEW ── */}
        {dashboardView === 'overview' && (() => {
          const totalCapacity = data.totalEntries + data.workCount;
          const failDemandPct = data.totalEntries > 0 ? Math.round((data.failureCount / data.totalEntries) * 100) : 0;
          const failWorkPct = data.workCount > 0 ? Math.round((data.workFailureCount / data.workCount) * 100) : 0;
          const demandRatio = totalCapacity > 0 ? Math.round((data.totalEntries / totalCapacity) * 100) : 0;
          const workRatio = totalCapacity > 0 ? Math.round((data.workCount / totalCapacity) * 100) : 0;

          return (
            <>
              {/* Key metrics cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card label={t('dashboard.totalCapacity')} value={totalCapacity} sub={`${data.totalEntries} ${t('dashboard.demandTab').toLowerCase()} + ${data.workCount} ${t('dashboard.workTab').toLowerCase()}`} />
                <Card label={t('dashboard.failureDemandPct')} value={`${failDemandPct}%`} sub={`${data.failureCount} / ${data.totalEntries}`} color={COLORS.failure} />
                {data.perfectPercentage > 0 && (
                  <Card label={t('dashboard.perfect')} value={`${data.perfectPercentage}%`} sub={t('dashboard.perfectSub')} color={COLORS.value} />
                )}
                <Card label={t('dashboard.failureWorkPct')} value={`${failWorkPct}%`} sub={`${data.workFailureCount} / ${data.workCount}`} color={COLORS.failure} />
                <Card label={t('dashboard.demandWorkRatio')} value={`${demandRatio}% : ${workRatio}%`} />
              </div>

              {/* Side-by-side demand vs work split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Demand split mini pie */}
                <ChartCard title={t('dashboard.demandSplit')}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('capture.value'), value: data.valueCount },
                          { name: t('capture.failure'), value: data.failureCount },
                          ...(data.unknownCount > 0 ? [{ name: '?', value: data.unknownCount }] : []),
                        ]}
                        cx="50%" cy="50%" outerRadius={60} innerRadius={25} dataKey="value"
                        label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        <Cell fill={COLORS.value} />
                        <Cell fill={COLORS.failure} />
                        {data.unknownCount > 0 && <Cell fill="#f59e0b" />}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: THEME.textSecondary }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Work split mini pie */}
                <ChartCard title={t('dashboard.workSplit')}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('capture.value'), value: data.workValueCount },
                          { name: t('capture.failure'), value: data.workFailureCount },
                          ...(data.workUnknownCount > 0 ? [{ name: '?', value: data.workUnknownCount }] : []),
                        ]}
                        cx="50%" cy="50%" outerRadius={60} innerRadius={25} dataKey="value"
                        label={(props) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        <Cell fill={COLORS.value} />
                        <Cell fill={COLORS.failure} />
                        {data.workUnknownCount > 0 && <Cell fill="#f59e0b" />}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: THEME.textSecondary }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Top 3 system conditions */}
              {data.failureCauses.length > 0 && (
                <ChartCard title={t('dashboard.topFailureCauses')}>
                  <div className="space-y-2">
                    {data.failureCauses.slice(0, 3).map((fc, i) => (
                      <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-red-300">#{i + 1}</span>
                          <span className="text-sm text-gray-800">{fc.cause}</span>
                        </div>
                        <span className="text-sm font-semibold text-red-600 ml-3 shrink-0">{fc.count}×</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </>
          );
        })()}

        {/* Data collection coverage (shown on all views) */}
        {data.collectorCounts && data.collectorCounts.length > 0 && (
          <ChartCard title={t('dashboard.collectionCoverage')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 rounded-lg bg-blue-50">
                <p className="text-lg font-bold text-blue-700">{data.collectorCounts.length}</p>
                <p className="text-xs text-gray-500">{t('dashboard.collectors')}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-blue-50">
                <p className="text-lg font-bold text-blue-700">{data.collectorCounts.reduce((s, c) => s + c.count, 0)}</p>
                <p className="text-xs text-gray-500">{t('dashboard.totalCaptures')}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-blue-50">
                <p className="text-lg font-bold text-blue-700">
                  {data.collectorCounts.length > 0 ? data.collectorCounts.sort((a, b) => b.lastActive.localeCompare(a.lastActive))[0].lastActive : '—'}
                </p>
                <p className="text-xs text-gray-500">{t('dashboard.lastCapture')}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {data.collectorCounts.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded bg-gray-50 text-sm">
                  <span className="text-gray-700">{c.name}</span>
                  <span className="text-xs text-gray-400">{t('dashboard.lastActive')}: {c.lastActive}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
        {/* Raw entries list */}
        {dashboardView === 'demand' && data.totalEntries > 0 && (
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowEntries(!showEntries)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900">{t('dashboard.entries')} ({data.totalEntries})</h3>
              <span className="text-gray-400 text-xs">{showEntries ? '▲' : '▼'}</span>
            </button>
            {showEntries && (
              <div className="border-t border-gray-200 px-5 py-3">
                {entriesLoading ? (
                  <p className="text-sm text-gray-500">{t('dashboard.loading')}</p>
                ) : (
                  <>
                    {/* Filter by demand type */}
                    {demandTypesEnabled && data.demandTypeCounts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        <button
                          onClick={() => setEntryFilter('')}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${!entryFilter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {t('dashboard.allTypes')}
                        </button>
                        {data.demandTypeCounts.map(dt => (
                          <button
                            key={dt.label}
                            onClick={() => setEntryFilter(dt.label)}
                            className={`text-xs px-2 py-1 rounded-full transition-colors ${entryFilter === dt.label ? (dt.category === 'failure' ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {tl(dt.label)} ({dt.count})
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="space-y-1.5 max-h-96 overflow-y-auto">
                      {entries
                        .filter(e => {
                          if (!entryFilter) return true;
                          return e.demandTypeId && demandTypeMap.get(e.demandTypeId) === entryFilter;
                        })
                        .map(e => (
                        <div key={e.id} className="flex items-start gap-3 py-2 px-3 rounded bg-gray-50 border border-gray-100">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-800">{e.verbatim}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleDateString()}</span>
                              {e.demandTypeId && demandTypeMap.get(e.demandTypeId) && (
                                <span className="text-xs text-gray-500">{tl(demandTypeMap.get(e.demandTypeId)!)}</span>
                              )}
                              {e.collectorName && <span className="text-xs text-gray-400">{e.collectorName}</span>}
                            </div>
                          </div>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                            e.classification === 'value' ? 'bg-green-100 text-green-700' :
                            e.classification === 'failure' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {e.classification === 'value' ? t('capture.value') : e.classification === 'failure' ? t('capture.failure') : '?'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingEntryId(e.id)}
                            className="shrink-0 text-xs px-2 py-0.5 rounded font-medium text-gray-500 bg-white border border-gray-200 hover:border-gray-400 hover:text-gray-700 transition-colors"
                          >
                            {t('dashboard.editEntry')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entry edit modal */}
      {editingEntryId && fullStudy && (
        <EntryEditModal
          code={code}
          entryId={editingEntryId}
          study={fullStudy}
          onClose={() => setEditingEntryId(null)}
          onSaved={async () => {
            await loadDashboard();
            const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries`);
            if (res.ok) {
              const d = await res.json();
              setEntries(d.entries || []);
            }
          }}
        />
      )}

      {/* Flow causes modal */}
      {selectedFlow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFlow(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{t('dashboard.flowCauses')}</h3>
                <button onClick={() => setSelectedFlow(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                <span className="text-green-600 font-medium">{selectedFlow.sourceName}</span>
                {' → '}
                <span className="text-red-600 font-medium">{selectedFlow.targetName}</span>
                <span className="text-gray-400 ml-2">({selectedFlow.count})</span>
              </p>
            </div>
            <div className="p-5">
              {flowCausesLoading ? (
                <p className="text-gray-500 text-sm">{t('dashboard.loading')}</p>
              ) : flowCauses && flowCauses.length > 0 ? (
                <div className="space-y-2">
                  {flowCauses.map((fc, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-800">{fc.cause}</span>
                      <span className="text-sm font-semibold text-red-600 ml-3 shrink-0">{fc.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{t('dashboard.flowCausesEmpty')}</p>
              )}
            </div>
          </div>
        </div>
      )}
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

function buildSankeyData(
  links: Array<{ sourceLabel: string; targetLabel: string; count: number }>,
  tl: (label: string) => string,
) {
  const sourceLabels = [...new Set(links.map(l => l.sourceLabel))];
  const targetLabels = [...new Set(links.map(l => l.targetLabel))];
  const nodes = [
    ...sourceLabels.map(label => ({ name: tl(label) })),
    ...targetLabels.map(label => ({ name: tl(label) })),
  ];
  const sourceIndex = new Map(sourceLabels.map((l, i) => [l, i]));
  const targetIndex = new Map(targetLabels.map((l, i) => [l, i + sourceLabels.length]));
  const sankeyLinks = links.map(l => ({
    source: sourceIndex.get(l.sourceLabel)!,
    target: targetIndex.get(l.targetLabel)!,
    value: l.count,
  }));
  // Map from link index to original (untranslated) labels for drill-down
  const linkMeta = new Map(links.map((l, i) => [i, {
    sourceLabel: l.sourceLabel,
    targetLabel: l.targetLabel,
    sourceName: tl(l.sourceLabel),
    targetName: tl(l.targetLabel),
    count: l.count,
  }]));
  return { nodes, links: sankeyLinks, sourceCount: sourceLabels.length, linkMeta };
}

function SankeyNode({ x, y, width, height, index, payload, sourceCount, fillOverride }: NodeProps & { sourceCount: number; fillOverride?: string }) {
  const isSource = index < sourceCount;
  const fill = fillOverride ?? (isSource ? '#22c55e' : '#ef4444');
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />
      <text
        x={isSource ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isSource ? 'end' : 'start'}
        dominantBaseline="central"
        fontSize={11}
        fill="#1f2937"
      >
        <title>{payload.name}</title>
        {payload.name.length > 25 ? payload.name.slice(0, 23) + '…' : payload.name}
      </text>
    </g>
  );
}

function SankeyLink({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, onClick, stroke }: LinkProps & { onClick?: () => void; stroke?: string }) {
  const color = stroke ?? '#ef4444';
  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={color}
      strokeWidth={linkWidth}
      strokeOpacity={onClick ? 0.3 : 0.2}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'stroke-opacity 0.15s' }}
      onClick={onClick}
      onMouseEnter={(e) => { if (onClick) { const el = e.target as SVGPathElement; el.style.strokeOpacity = '0.6'; el.style.strokeWidth = String(Math.max(linkWidth + 2, linkWidth * 1.3)); } }}
      onMouseLeave={(e) => { const el = e.target as SVGPathElement; el.style.strokeOpacity = onClick ? '0.3' : '0.2'; el.style.strokeWidth = String(linkWidth); }}
    />
  );
}

const STOPWORDS = new Set([
  // English
  'the','is','at','which','on','a','an','and','or','but','in','to','for','of','with','it','this','that','was','are','be',
  'has','had','not','we','they','he','she','my','your','from','by','as','do','if','so','no','up','out','can','will',
  'just','one','all','been','have','their','what','when','how','who','than','its','also','very','much','more','about',
  // Danish
  'og','at','er','det','en','den','til','på','for','med','af','har','de','som','ikke','var','han','sig','der','jeg',
  'et','vi','kan','fra','men','om','over','efter','blev','ud','vil','skal','her','have','ham','hun','sin','også','da',
  'kun','mod','nu','eller','meget','min','mit','mere','dem','des','dig','din','dit',
  // Swedish
  'och','att','en','den','det','som','för','med','av','till','har','de','inte','är','var','han','sig','jag','ett',
  'vi','kan','från','men','om','efter','ut','vill','ska','här','ha','honom','hon','sin','också','bara','mot','nu',
  'eller','mycket','denna','detta','dessa','min','mitt','mer','dem','dig','din','ditt',
  // German
  'und','zu','den','das','ist','ein','es','auf','für','mit','dem','die','der','sich','des','sie','von','an','nicht',
  'als','auch','war','so','dass','kann','hat','noch','nach','wie','am','aus','bei','nur','aber','wenn','oder','sehr',
  'ich','wir','ihr','mein','mehr','einem','eine','einer',
]);

function extractThemes(notes: string[]): Array<{ term: string; count: number }> {
  const wordCounts = new Map<string, number>();
  const bigramCounts = new Map<string, number>();

  for (const text of notes) {
    const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
    for (const w of words) {
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
    }
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
    }
  }

  const results: Array<{ term: string; count: number }> = [];
  for (const [term, count] of wordCounts) {
    if (count >= 2) results.push({ term, count });
  }
  for (const [term, count] of bigramCounts) {
    if (count >= 2) results.push({ term, count });
  }
  results.sort((a, b) => b.count - a.count);
  return results.slice(0, 20);
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl shadow-sm p-5 bg-white border border-gray-200 overflow-hidden">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">{title}</h3>
      {children}
    </div>
  );
}
