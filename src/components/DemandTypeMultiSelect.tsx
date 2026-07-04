'use client';

/**
 * DemandTypeMultiSelect — a compact multi-select dropdown for scoping a
 * subquestion to demand types (0055). Used twice under a question's Advanced
 * section: "Exclude for" (hide + un-gate) and "Not mandatory for" (keep shown,
 * un-gate). Click the trigger to open a checklist; ticking a row PUTs the full
 * desired set to `subquestions/{id}/{resource}` (diff-set server-side), then
 * refreshes. Empty set = applies to every case.
 *
 * The popover is portaled to <body> with position:fixed (like InfoPopover) so it
 * never clips inside the milestone card's stacking context.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '@/lib/locale-context';

export interface DemandTypeOption { id: string; label: string; }

interface Props {
  code: string;
  sqId: string;
  resource: 'exclusions' | 'optional';
  label: string;
  variant: 'red' | 'amber';
  selected: string[];
  demandTypes: DemandTypeOption[];
  onRefresh: () => Promise<void> | void;
}

export default function DemandTypeMultiSelect({ code, sqId, resource, label, variant, selected, demandTypes, onRefresh }: Props) {
  const { t, tl } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const set = new Set(selected);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (popRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggleOpen = () => {
    if (open) { setOpen(false); return; }
    const btn = wrapRef.current?.querySelector('button');
    if (btn) { const r = btn.getBoundingClientRect(); setCoords({ left: r.left, top: r.bottom + 4, width: Math.max(r.width, 180) }); }
    setOpen(true);
  };

  const toggle = async (dtId: string) => {
    if (busy) return;
    setBusy(true);
    const next = new Set(set);
    if (next.has(dtId)) next.delete(dtId); else next.add(dtId);
    await fetch(`/api/studies/${encodeURIComponent(code)}/subquestions/${sqId}/${resource}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demandTypeIds: [...next] }),
    });
    await onRefresh();
    setBusy(false);
  };

  if (demandTypes.length === 0) return null;

  const chosen = demandTypes.filter((d) => set.has(d.id));
  const summary = chosen.length === 0
    ? t('settings.demandTypePickerEmpty')
    : chosen.map((d) => tl(d.label)).join(', ');
  const accent = variant === 'red' ? 'text-red-700' : 'text-amber-700';

  return (
    <span ref={wrapRef} className="flex items-center gap-1.5 px-1 text-[11px]">
      <span className="text-gray-500 whitespace-nowrap">{label}</span>
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 max-w-[220px] px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-50 ${chosen.length ? accent + ' font-medium' : 'text-gray-400'}`}
      >
        <span className="truncate">{summary}</span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={popRef}
          role="listbox"
          className="fixed z-50 max-h-64 overflow-auto rounded-lg bg-white border border-gray-200 shadow-lg py-1"
          style={{ left: coords.left, top: coords.top, minWidth: coords.width }}
        >
          {demandTypes.map((d) => {
            const on = set.has(d.id);
            return (
              <button
                key={d.id}
                type="button"
                disabled={busy}
                onClick={() => toggle(d.id)}
                className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded border ${on ? (variant === 'red' ? 'bg-red-600 border-red-600' : 'bg-amber-500 border-amber-500') + ' text-white' : 'border-gray-300'}`}>
                  {on ? '✓' : ''}
                </span>
                {tl(d.label)}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </span>
  );
}
