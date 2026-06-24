'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useLocale } from '@/lib/locale-context';
import InfoPopover from '@/components/InfoPopover';

// Synthesis of system conditions (migration 0028). The team studies the captured
// distribution and converges duplicate categories — Same / Similar / Different —
// onto one agreed name. Selecting several rows and merging re-points every linked
// record to the survivor and soft-archives the rest (reversible via the log).

const SKY = '#0ea5e9'; // sky-500 — the system-conditions strand (design-system §2)
const GRID = '#e5e7eb';
const TEXT_SECONDARY = '#6b7280';
// Sky/blue/indigo family for multi-series charts — stays in the SC strand and
// never collides with the green(value)/red(failure) classification semantics.
const PALETTE = ['#0ea5e9', '#3b82f6', '#6366f1', '#0891b2', '#2563eb', '#7c3aed', '#0284c7', '#4f46e5'];
const OVER_TIME_TOP_N = 8;

type Freq = { id: string; label: string; count: number };
type OverTimeRow = { date: string; systemConditionId: string; count: number };
type MergeRow = {
  id: string;
  createdAt: string;
  targetId: string;
  targetLabel: string;
  sources: { id: string; label: string }[];
};

export default function SystemConditionSynthesis({ code }: { code: string }) {
  const { t, tl } = useLocale();
  const [freqs, setFreqs] = useState<Freq[]>([]);
  const [overTime, setOverTime] = useState<OverTimeRow[]>([]);
  const [merges, setMerges] = useState<MergeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [keepId, setKeepId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/studies/${encodeURIComponent(code)}/system-conditions`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, mRes, oRes] = await Promise.all([
        fetch(`${base}/frequencies`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${base}/merge`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${base}/over-time`).then((r) => (r.ok ? r.json() : [])),
      ]);
      setFreqs(Array.isArray(fRes) ? fRes : []);
      setMerges(Array.isArray(mRes) ? mRes : []);
      setOverTime(Array.isArray(oRes) ? oRes : []);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  // Display labels resolved through tl (labels may be multi-locale JSON).
  const rows = useMemo(() => freqs.map((f) => ({ ...f, display: tl(f.label) })), [freqs, tl]);
  const selectedRows = rows.filter((r) => selected.has(r.id));

  // Default the survivor to the highest-count selected condition.
  useEffect(() => {
    if (selectedRows.length === 0) { setKeepId(null); return; }
    if (!keepId || !selected.has(keepId)) {
      const top = [...selectedRows].sort((a, b) => b.count - a.count)[0];
      setKeepId(top.id);
    }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => { setSelected(new Set()); setKeepId(null); setNewName(''); };

  const doMerge = async () => {
    if (!keepId || selectedRows.length < 2 || busy) return;
    setBusy(true); setError(null);
    try {
      const sourceIds = selectedRows.map((r) => r.id).filter((id) => id !== keepId);
      const res = await fetch(`${base}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: keepId, sourceIds, newLabel: newName.trim() || undefined }),
      });
      if (!res.ok) { setError((await res.json().catch(() => ({}))).error || t('synthesis.mergeFailed')); return; }
      clearSelection();
      await load();
    } finally { setBusy(false); }
  };

  const doRename = async (id: string) => {
    const label = editLabel.trim();
    if (!label || busy) { setEditingId(null); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${base}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) { setError(t('synthesis.renameFailed')); return; }
      setEditingId(null);
      await load();
    } finally { setBusy(false); }
  };

  const doUndo = async (mergeId: string) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${base}/unmerge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mergeId }),
      });
      if (!res.ok) { setError((await res.json().catch(() => ({}))).error || t('synthesis.undoFailed')); return; }
      await load();
    } finally { setBusy(false); }
  };

  if (loading) {
    return <div className="text-sm text-gray-400 py-8 text-center">{t('capture.loading')}</div>;
  }

  const chartData = rows.filter((r) => r.count > 0); // rows are count-desc from the API

  // Over-time: chart the top-N conditions (by total), pivoted to one field per
  // condition id, so labels with identical text can't collide.
  const topConds = chartData.slice(0, OVER_TIME_TOP_N);
  const topIds = new Set(topConds.map((c) => c.id));
  const otTruncated = chartData.length > OVER_TIME_TOP_N;
  const byDate = new Map<string, Record<string, number | string>>();
  for (const r of overTime) {
    if (!topIds.has(r.systemConditionId)) continue;
    let row = byDate.get(r.date);
    if (!row) { row = { date: r.date }; byDate.set(r.date, row); }
    row[r.systemConditionId] = ((row[r.systemConditionId] as number) || 0) + r.count;
  }
  const lineData = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return (
    <div className="space-y-5">
      {/* Heading + Same/Similar/Different framing */}
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-gray-900">{t('synthesis.heading')}</h2>
          <InfoPopover label={t('synthesis.heading')}>{t('synthesis.intro')}</InfoPopover>
        </div>
        <p className="text-xs text-gray-400 mt-1">{t('synthesis.selectHint')}</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>
      )}

      {rows.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center">{t('synthesis.empty')}</div>
      ) : (
        <>
          {/* Distribution histogram (read-only visual) */}
          {chartData.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('synthesis.distributionTitle')}</h3>
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 38 + 40)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: TEXT_SECONDARY }} />
                  <YAxis
                    type="category"
                    dataKey="display"
                    width={180}
                    interval={0}
                    tick={{ fontSize: 10, fill: TEXT_SECONDARY }}
                    tickFormatter={(v: string) => (v.length > 28 ? v.slice(0, 26) + '…' : v)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill={SKY} radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="count" position="right" style={{ fill: TEXT_SECONDARY, fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Proportion pie (same data as the histogram, as a share-of-whole view) */}
          {chartData.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('synthesis.pieTitle')}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={32}
                    dataKey="count"
                    nameKey="display"
                    label={(p) => `${((p.percent || 0) * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {chartData.map((_, i) => (<Cell key={i} fill={PALETTE[i % PALETTE.length]} />))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: TEXT_SECONDARY }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* System conditions over time — top-N conditions as lines by day */}
          {lineData.length > 1 && (
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('synthesis.overTimeTitle')}</h3>
              {otTruncated && <p className="text-xs text-gray-400 mb-2">{t('synthesis.overTimeTopN')}</p>}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: TEXT_SECONDARY }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TEXT_SECONDARY }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: TEXT_SECONDARY }} />
                  {topConds.map((c, i) => (
                    <Line key={c.id} type="monotone" dataKey={c.id} name={c.display} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Selectable list — pick the sames/similars to merge */}
          <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                {editingId === r.id ? (
                  <input
                    autoFocus
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={() => doRename(r.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') doRename(r.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 text-sm px-2 py-1 rounded-md border border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                ) : (
                  <button
                    onClick={() => { setEditingId(r.id); setEditLabel(r.display); }}
                    className="flex-1 text-left text-sm text-gray-800 hover:text-sky-700"
                    title={t('synthesis.rename')}
                  >
                    {r.display}
                  </button>
                )}
                <span className="text-xs text-gray-400 tabular-nums">{r.count}</span>
              </div>
            ))}
          </div>

          {/* Merge panel — appears once 2+ are selected */}
          {selectedRows.length >= 2 && (
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 space-y-3">
              <div className="text-sm font-medium text-sky-900">
                {t('synthesis.mergeInto')} ({selectedRows.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedRows.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setKeepId(r.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      keepId === r.id
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-sky-400'
                    }`}
                  >
                    {r.display}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-sky-900 mb-1">{t('synthesis.renameOptional')}</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={keepId ? selectedRows.find((r) => r.id === keepId)?.display : ''}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={doMerge}
                  disabled={busy || !keepId}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {t('synthesis.mergeButton')}
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  {t('synthesis.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Recent merges — traceability + undo */}
          {merges.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('synthesis.recentMerges')}</h3>
              <ul className="space-y-2">
                {merges.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600">
                      <span className="text-gray-400 line-through">{m.sources.map((s) => tl(s.label)).join(', ')}</span>
                      {' → '}
                      <span className="font-medium text-gray-900">{tl(m.targetLabel)}</span>
                    </span>
                    <button
                      onClick={() => doUndo(m.id)}
                      disabled={busy}
                      className="shrink-0 px-3 py-1 rounded-md text-xs font-medium text-sky-700 border border-sky-300 hover:bg-sky-50 disabled:opacity-50"
                    >
                      {t('synthesis.undo')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
