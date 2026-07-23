'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale-context';

// Consultant "Manage cases" list (migration 0066), rendered inside the PIN-unlocked
// Settings area. Lists every case (incl. archived) and lets a consultant archive
// (hide from the data, reversibly) or permanently delete a case + all its touches.
// The PIN is cached in localStorage from the settings unlock; each call sends it and
// the server re-verifies.
type CaseRow = {
  id: string;
  caseRef: string;
  status: 'open' | 'closed';
  archivedAt: string | null;
  entryCount: number;
};

export default function ManageCasesSection({ code }: { code: string }) {
  const { t } = useLocale();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Inline case-reference edit (2026-07-16): fix a mistyped case number in place
  // instead of archiving/deleting and recapturing (which loses the touches).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases?includeArchived=1`);
    if (res.ok) setCases(await res.json());
    setLoading(false);
  }, [code]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const pin = () => (typeof window !== 'undefined' ? localStorage.getItem(`consultant_pin_${code}`) ?? '' : '');

  async function setArchived(id: string, archived: boolean) {
    setBusyId(id); setError('');
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(id)}/archive`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived, pin: pin() }),
    });
    setBusyId(null);
    if (!res.ok) { setError(t('consultant.wrongPin')); return; }
    await load();
  }

  async function remove(id: string) {
    setBusyId(id); setError('');
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin() }),
    });
    setBusyId(null); setConfirmDeleteId(null);
    if (!res.ok) { setError(t('consultant.wrongPin')); return; }
    await load();
  }

  function startEdit(c: CaseRow) {
    setEditingId(c.id); setEditValue(c.caseRef); setEditError(''); setError('');
  }
  function cancelEdit() {
    setEditingId(null); setEditValue(''); setEditError('');
  }
  async function saveEdit(id: string) {
    const ref = editValue.trim();
    if (!ref) return; // Save is disabled when empty; guard anyway.
    setBusyId(id); setEditError('');
    const res = await fetch(`/api/studies/${encodeURIComponent(code)}/cases/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseRef: ref, pin: pin() }),
    });
    setBusyId(null);
    // 409 = the ref is already used by another case in this study (uniqStudyCaseRef).
    if (res.status === 409) { setEditError(t('settings.caseRefExists')); return; }
    if (!res.ok) { setEditError(t('consultant.wrongPin')); return; }
    setEditingId(null); setEditValue('');
    await load();
  }

  const touchLabel = (n: number) => (n === 1 ? t('capture.customerTouchOne') : t('capture.customerTouches', { n: String(n) }));

  if (loading) return <p className="text-sm text-gray-400">…</p>;
  if (cases.length === 0) return <p className="text-sm text-gray-400">{t('settings.manageCasesEmpty')}</p>;

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <ul className="divide-y divide-gray-100">
        {cases.map((c) => {
          const archived = !!c.archivedAt;
          if (editingId === c.id) {
            return (
              <li key={c.id} className="py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">#</span>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') cancelEdit(); }}
                    maxLength={64}
                    placeholder={t('capture.caseRefPlaceholder')}
                    className="flex-1 min-w-0 px-2 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-brand outline-none"
                  />
                  <button
                    type="button"
                    disabled={busyId === c.id || !editValue.trim()}
                    onClick={() => saveEdit(c.id)}
                    className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50 transition-colors"
                  >{t('settings.save')}</button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                  >{t('settings.cancel')}</button>
                </div>
                {editError && <p className="text-xs text-red-600 mt-1 pl-4">{editError}</p>}
              </li>
            );
          }
          return (
            <li key={c.id} className="flex items-center gap-2 py-2">
              <span className="font-medium text-gray-900 tabular-nums text-sm min-w-[4rem] whitespace-nowrap">#{c.caseRef}</span>
              {!archived && (
                <button
                  type="button"
                  aria-label={t('settings.caseEditAria')}
                  title={t('settings.caseEditAria')}
                  onClick={() => startEdit(c)}
                  className="shrink-0 text-gray-400 hover:text-brand transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
              )}
              {c.status === 'closed' && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-500">{t('capture.caseStatusClosed')}</span>}
              {archived && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700">{t('settings.caseArchivedBadge')}</span>}
              <span className="flex-1 min-w-0 truncate text-xs text-gray-400 tabular-nums">{touchLabel(c.entryCount)}</span>
              {!archived ? (
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => setArchived(c.id, true)}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium border border-amber-300 bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                >
                  {t('capture.caseArchive')}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    onClick={() => setArchived(c.id, false)}
                    className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {t('settings.caseRestore')}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    onClick={() => (confirmDeleteId === c.id ? remove(c.id) : setConfirmDeleteId(c.id))}
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium border disabled:opacity-50 transition-colors ${
                      confirmDeleteId === c.id
                        ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                        : 'border-red-300 bg-white text-red-700 hover:bg-red-50'
                    }`}
                  >
                    {confirmDeleteId === c.id ? t('settings.caseDeleteConfirm') : t('settings.caseDeletePermanent')}
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
