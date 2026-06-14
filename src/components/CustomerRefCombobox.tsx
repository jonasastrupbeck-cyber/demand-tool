'use client';

/**
 * CustomerRefCombobox — the flow-mode customer entry field (2026-06-14).
 *
 * One unified type-ahead reference field replaces the old two-card chooser.
 * What you type decides everything: a match continues that customer, no match
 * lets you open it as a new one — so you never get stuck on a sub-screen and can
 * always change your mind by retyping.
 *
 *  - Empty + focused → dropdown lists the recent OPEN customers (one-tap pick-up).
 *  - Typing → dropdown filters to customers whose reference starts with what you
 *    typed (autocomplete), exact match first.
 *  - Typed reference with no exact match → an "Open #X as a new customer" footer.
 *
 * Reuses PillSelect's popover plumbing (click-outside + Escape, viewport clamp).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '@/lib/locale-context';

export interface CustomerOption {
  id: string;
  caseRef: string;
  status: 'open' | 'closed';
  openedAt: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  customers: CustomerOption[];
  /** Resolve to a customer — existing (its ref) or new (the typed ref). The
   *  parent's find-or-create handles both; this is purely which row was chosen. */
  onSelect: (caseRef: string) => void;
  disabled?: boolean;
}

type Item =
  | { type: 'customer'; caseRef: string; status: 'open' | 'closed' }
  | { type: 'new'; caseRef: string };

export default function CustomerRefCombobox({ value, onChange, customers, onSelect, disabled }: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const recent = useMemo(
    () =>
      customers
        .filter((c) => c.status === 'open')
        .slice()
        .sort((a, b) => (b.openedAt || '').localeCompare(a.openedAt || ''))
        .slice(0, 5),
    [customers],
  );

  const items = useMemo<Item[]>(() => {
    const v = value.trim();
    const base = v ? customers.filter((c) => c.caseRef.startsWith(v)) : recent;
    const sorted = base.slice().sort((a, b) => {
      if (a.caseRef === v) return -1;
      if (b.caseRef === v) return 1;
      return (b.openedAt || '').localeCompare(a.openedAt || '');
    });
    const rows: Item[] = sorted.map((c) => ({ type: 'customer', caseRef: c.caseRef, status: c.status }));
    const exact = customers.some((c) => c.caseRef === v);
    if (v && !exact) rows.push({ type: 'new', caseRef: v });
    return rows;
  }, [value, customers, recent]);

  // Keep the highlight within range as the filtered list changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlight((h) => (items.length === 0 ? 0 : Math.min(h, items.length - 1)));
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: PointerEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Shift the popover horizontally if it would clip the viewport.
  const popoverMountRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    el.style.transform = '';
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let shift = 0;
    if (rect.left < margin) shift = margin - rect.left;
    else if (rect.right > window.innerWidth - margin) shift = window.innerWidth - margin - rect.right;
    if (shift !== 0) el.style.transform = `translateX(${shift}px)`;
  }, []);

  function select(item: Item) {
    if (disabled) return;
    onSelect(item.caseRef);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items.length > 0) select(items[Math.min(highlight, items.length - 1)]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showRecentHeader = value.trim() === '' && recent.length > 0;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        inputMode="numeric"
        role="combobox"
        aria-expanded={open}
        aria-controls="customer-ref-listbox"
        aria-autocomplete="list"
        value={value}
        disabled={disabled}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t('capture.customerRefPlaceholder')}
        aria-label={t('capture.customerRefPlaceholder')}
        className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none disabled:opacity-50"
      />
      {open && (
        <div
          ref={popoverMountRef}
          id="customer-ref-listbox"
          role="listbox"
          className="absolute z-30 left-0 right-0 top-full mt-1.5 max-w-[calc(100vw-2rem)] py-1 rounded-lg bg-white border border-gray-200 shadow-lg max-h-72 overflow-auto"
        >
          {showRecentHeader && (
            <p className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-widest text-gray-400 font-medium">
              {t('capture.customerRecentOpen')}
            </p>
          )}
          {items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">{t('capture.customerRefPlaceholder')}</div>
          ) : (
            items.map((item, i) => {
              const isHi = i === highlight;
              if (item.type === 'new') {
                return (
                  <button
                    key="__new__"
                    type="button"
                    role="option"
                    aria-selected={isHi}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => select(item)}
                    className={`w-full text-left px-3 py-2 text-sm whitespace-nowrap text-sky-700 transition-colors ${
                      i > 0 ? 'border-t border-gray-100' : ''
                    } ${isHi ? 'bg-sky-50' : 'hover:bg-sky-50'}`}
                  >
                    + {t('capture.customerOpenAsNew', { ref: item.caseRef })}
                  </button>
                );
              }
              return (
                <button
                  key={item.caseRef}
                  type="button"
                  role="option"
                  aria-selected={isHi}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => select(item)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${
                    isHi ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium tabular-nums">#{item.caseRef}</span>
                  {item.status === 'closed' && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-500">
                      {t('capture.caseStatusClosed')}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
