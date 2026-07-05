'use client';

/**
 * DemandTypeMultiSelect — a compact multi-select dropdown for scoping a
 * subquestion to demand types (0055). Used twice under a question's Advanced
 * section: "Exclude for" (hide + un-gate) and "Not mandatory for" (keep shown,
 * un-gate). Click the trigger to open a checklist; ticking a row PUTs the full
 * desired set to `subquestions/{id}/{resource}` (diff-set server-side), then
 * refreshes. Empty set = applies to every case.
 *
 * The popover is ABSOLUTE-positioned, anchored under the trigger, so it moves
 * with the page on scroll (behaves like a dropdown). The settings milestone
 * card no longer clips it (overflow-hidden was removed there for the preset
 * dropdown). Escape + click-outside dismiss.
 */

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/locale-context';

export interface DemandTypeOption { id: string; label: string; }

interface Props {
  // Full PUT URL that persists { demandTypeIds }. Lets the same dropdown drive
  // subquestion exclusions/optional AND milestone exclusions.
  endpoint: string;
  label: string;
  variant: 'red' | 'amber';
  selected: string[];
  demandTypes: DemandTypeOption[];
  onRefresh: () => Promise<void> | void;
}

export default function DemandTypeMultiSelect({ endpoint, label, variant, selected, demandTypes, onRefresh }: Props) {
  const { t, tl } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const set = new Set(selected);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = async (dtId: string) => {
    if (busy) return;
    setBusy(true);
    const next = new Set(set);
    if (next.has(dtId)) next.delete(dtId); else next.add(dtId);
    try {
      await fetch(endpoint, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandTypeIds: [...next] }),
      });
      await onRefresh();
    } finally {
      // Always clear busy — a rejected fetch must not freeze the control.
      setBusy(false);
    }
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
      <span className="relative inline-flex">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1 max-w-[220px] px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-50 ${chosen.length ? accent + ' font-medium' : 'text-gray-400'}`}
        >
          <span className="truncate">{summary}</span>
          <span className="text-gray-400">▾</span>
        </button>
        {open && (
          <div
            role="listbox"
            className="absolute left-0 top-full mt-1 z-30 min-w-[180px] max-h-64 overflow-auto rounded-lg bg-white border border-gray-200 shadow-lg py-1"
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
          </div>
        )}
      </span>
    </span>
  );
}
