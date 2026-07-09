'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, LineChart, Line, Legend } from 'recharts';
import { useLocale } from '@/lib/locale-context';
import InfoPopover from '@/components/InfoPopover';

// Generic "synthesise a taxonomy" surface (Same / Similar / Different): study the
// captured distribution, then merge the sames+similars onto one agreed name. The
// backend re-points every linked record and soft-archives the rest (reversible
// via the merge log). Used for system conditions, work types, and work step types
// — only the apiBase + labels differ; the UI is identical.

const SKY = '#0ea5e9';
const GRID = '#e5e7eb';
const TEXT_SECONDARY = '#6b7280';
const PALETTE = ['#0ea5e9', '#3b82f6', '#6366f1', '#0891b2', '#2563eb', '#7c3aed', '#0284c7', '#4f46e5'];
const OVER_TIME_TOP_N = 8;

export type SynthesisLabels = {
  heading: string; intro: string; selectHint: string; empty: string;
  distributionTitle: string; overTimeTitle: string; overTimeTopN: string;
  mergeInto: string; renameOptional: string; mergeButton: string; cancel: string; rename: string;
  recentMerges: string; undo: string; loading: string;
  mergeFailed: string; renameFailed: string; undoFailed: string;
};

type Freq = { id: string; label: string; count: number };
type OverTimeRow = { date: string; id: string; count: number };
type MergeRow = {
  id: string; createdAt: string; targetId: string; targetLabel: string;
  sources: { id: string; label: string }[];
};

export default function TaxonomySynthesis({ apiBase, labels, hasOverTime = true, valueDemands }: {
  apiBase: string;
  labels: SynthesisLabels;
  hasOverTime?: boolean;
  valueDemands?: string[];
}) {
  const { tl } = useLocale();
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

  const load = useCallback(async () => {
    setLoading(true);
    // Value-demand scope applies to the distribution reads (frequencies + over-time)
    // only; the merge log stays study-wide (a category is shared across all demands).
    const q = valueDemands && valueDemands.length ? `?valueDemands=${encodeURIComponent(valueDemands.join(','))}` : '';
    try {
      const [fRes, mRes, oRes] = await Promise.all([
        fetch(`${apiBase}/frequencies${q}`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${apiBase}/merge`).then((r) => (r.ok ? r.json() : [])),
        hasOverTime ? fetch(`${apiBase}/over-time${q}`).then((r) => (r.ok ? r.json() : [])) : Promise.resolve([]),
      ]);
      setFreqs(Array.isArray(fRes) ? fRes : []);
      setMerges(Array.isArray(mRes) ? mRes : []);
      setOverTime(Array.isArray(oRes) ? oRes : []);
    } finally {
      setLoading(false);
    }
  }, [apiBase, hasOverTime, valueDemands]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => freqs.map((f) => ({ ...f, display: tl(f.label) })), [freqs, tl]);
  const selectedRows = rows.filter((r) => selected.has(r.id));

  useEffect(() => {
    // Prune selected ids that no longer exist (e.g. a rename-to-existing merge
    // archived one via load()), then keep keepId valid against the LIVE rows —
    // otherwise doMerge could post a merge into an already-archived target.
    const liveIds = new Set(rows.map((r) => r.id));
    const stillSelected = [...selected].filter((id) => liveIds.has(id));
    if (stillSelected.length !== selected.size) {
      setSelected(new Set(stillSelected)); // re-runs this effect
      return;
    }
    if (selectedRows.length === 0) { setKeepId(null); return; }
    if (!keepId || !selected.has(keepId) || !liveIds.has(keepId)) {
      const top = [...selectedRows].sort((a, b) => b.count - a.count)[0];
      setKeepId(top.id);
    }
  }, [selected, rows]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const res = await fetch(`${apiBase}/merge`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: keepId, sourceIds, newLabel: newName.trim() || undefined }),
      });
      if (!res.ok) { setError((await res.json().catch(() => ({}))).error || labels.mergeFailed); return; }
      clearSelection();
      await load();
    } finally { setBusy(false); }
  };

  const doRename = async (id: string) => {
    const label = editLabel.trim();
    if (!label || busy) { setEditingId(null); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        // mergeOnCollision: in the synthesis surface, renaming to an existing
        // live name means "these are the same" → merge rather than duplicate.
        body: JSON.stringify({ label, mergeOnCollision: true }),
      });
      if (!res.ok) { setError(labels.renameFailed); return; }
      setEditingId(null);
      await load();
    } finally { setBusy(false); }
  };

  const doUndo = async (mergeId: string) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${apiBase}/unmerge`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mergeId }),
      });
      if (!res.ok) { setError((await res.json().catch(() => ({}))).error || labels.undoFailed); return; }
      await load();
    } finally { setBusy(false); }
  };

  // Derived chart data — memoized so it isn't rebuilt (and the three charts
  // re-rendered) on every keystroke in the rename/merge-name inputs. Depends
  // only on rows + overTime. Hoisted above the early return so the hook order
  // stays stable.
  const { chartData, topConds, otTruncated, lineData } = useMemo(() => {
    const chartData = rows.filter((r) => r.count > 0);
    const topConds = chartData.slice(0, OVER_TIME_TOP_N);
    const topIds = new Set(topConds.map((c) => c.id));
    const otTruncated = chartData.length > OVER_TIME_TOP_N;
    const byDate = new Map<string, Record<string, number | string>>();
    for (const r of overTime) {
      if (!topIds.has(r.id)) continue;
      let row = byDate.get(r.date);
      if (!row) { row = { date: r.date }; byDate.set(r.date, row); }
      row[r.id] = ((row[r.id] as number) || 0) + r.count;
    }
    const lineData = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return { chartData, topConds, otTruncated, lineData };
  }, [rows, overTime]);

  if (loading) {
    return <div className="text-sm text-gray-400 py-8 text-center">{labels.loading}</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-gray-900">{labels.heading}</h2>
          <InfoPopover label={labels.heading}>{labels.intro}</InfoPopover>
        </div>
        <p className="text-xs text-gray-400 mt-1">{labels.selectHint}</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>
      )}

      {rows.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center">{labels.empty}</div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{labels.distributionTitle}</h3>
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 38 + 40)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: TEXT_SECONDARY }} />
                  <YAxis type="category" dataKey="display" width={180} interval={0} tick={{ fontSize: 10, fill: TEXT_SECONDARY }} tickFormatter={(v: string) => (v.length > 28 ? v.slice(0, 26) + '…' : v)} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill={SKY} radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="count" position="right" style={{ fill: TEXT_SECONDARY, fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {hasOverTime && lineData.length > 1 && (
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{labels.overTimeTitle}</h3>
              {otTruncated && <p className="text-xs text-gray-400 mb-2">{labels.overTimeTopN}</p>}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: TEXT_SECONDARY }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TEXT_SECONDARY }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: TEXT_SECONDARY }} />
                  {topConds.map((c, i) => (
                    <Line key={c.id} type="monotone" dataKey={c.id} name={c.display} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                {editingId === r.id ? (
                  <input autoFocus value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={() => doRename(r.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') doRename(r.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 text-sm px-2 py-1 rounded-md border border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                ) : (
                  <button onClick={() => { setEditingId(r.id); setEditLabel(r.display); }}
                    className="flex-1 text-left text-sm text-gray-800 hover:text-sky-700" title={labels.rename}>
                    {r.display}
                  </button>
                )}
                <span className="text-xs text-gray-400 tabular-nums">{r.count}</span>
              </div>
            ))}
          </div>

          {selectedRows.length >= 2 && (
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 space-y-3">
              <div className="text-sm font-medium text-sky-900">{labels.mergeInto} ({selectedRows.length})</div>
              <div className="flex flex-wrap gap-2">
                {selectedRows.map((r) => (
                  <button key={r.id} onClick={() => setKeepId(r.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      keepId === r.id ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-700 border-gray-300 hover:border-sky-400'
                    }`}>
                    {r.display}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-sky-900 mb-1">{labels.renameOptional}</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder={keepId ? selectedRows.find((r) => r.id === keepId)?.display : ''}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={doMerge} disabled={busy || !keepId}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50">
                  {labels.mergeButton}
                </button>
                <button onClick={clearSelection} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                  {labels.cancel}
                </button>
              </div>
            </div>
          )}

          {merges.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{labels.recentMerges}</h3>
              <ul className="space-y-2">
                {merges.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600">
                      <span className="text-gray-400 line-through">{m.sources.map((s) => tl(s.label)).join(', ')}</span>
                      {' → '}
                      <span className="font-medium text-gray-900">{tl(m.targetLabel)}</span>
                    </span>
                    <button onClick={() => doUndo(m.id)} disabled={busy}
                      className="shrink-0 px-3 py-1 rounded-md text-xs font-medium text-sky-700 border border-sky-300 hover:bg-sky-50 disabled:opacity-50">
                      {labels.undo}
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
