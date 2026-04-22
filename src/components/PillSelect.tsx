'use client';

/**
 * PillSelect — a pill-shaped dropdown replacement.
 *
 * Closed state: a single pill showing the selected option's label, or the
 * placeholder if nothing's picked. Click opens a popover with the full list.
 * Selecting an option closes the popover and fires onChange. Click-outside
 * and Escape dismiss.
 *
 * Nicer to look at than a native <select>, and keeps the compact pill
 * language used elsewhere in the capture form.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PillSelectOption {
  id: string;
  label: string;
  /** Optional operational definition, surfaced as a muted subtitle under the
   *  option's label in the popover — lets users learn what a type means at the
   *  moment they're choosing it. */
  operationalDefinition?: string | null;
}

export type PillSelectVariant = 'default' | 'value' | 'valueLight' | 'sequence' | 'failure' | 'add' | 'thinking';

interface Props {
  value: string; // option id, or '' for "not selected"
  onChange: (id: string) => void;
  options: PillSelectOption[];
  placeholder: string;
  ariaLabel?: string;
  className?: string;
  /** Colour theme. 'value' = green, 'failure' = red, 'default' = neutral grey. */
  variant?: PillSelectVariant;
  /** When provided, renders a "+ new" action at the bottom of the popover that
   *  fires this callback instead of selecting an option. Lets the same pill drive
   *  both "pick existing" and "create new" flows without a separate "+" button. */
  onAddNew?: () => void;
  /** Label for the "+ new" action row in the popover. */
  addNewLabel?: string;
}

function pillClasses(variant: PillSelectVariant, hasSelection: boolean): string {
  if (variant === 'add') {
    // "+ Add ..." style — solid light-blue (sky) outline. Used for system condition.
    return 'bg-white text-sky-700 border-sky-300 hover:border-sky-500 hover:bg-sky-50';
  }
  if (variant === 'thinking') {
    // Deeper-blue twin of the 'add' variant, used for the Thinking strand so
    // it's visually distinct from System Condition's sky 'add' pill. Uses
    // Tailwind blue-* tokens (true blue, not purple).
    return 'bg-white text-blue-700 border-blue-400 hover:border-blue-600 hover:bg-blue-50';
  }
  if (variant === 'value') {
    // Dark solid green + white text. Matches the Classification "Value" pill when
    // selected — same format, same weight. Asserts "this is the value demand".
    return 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700';
  }
  if (variant === 'valueLight') {
    // Light green wash. Matches the "What matters" pills + the unselected Classification
    // "Value" pill. Used where green = positive but the field is ambient context
    // (e.g. Life problem to be solved).
    return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
  }
  if (variant === 'sequence') {
    // Solid emerald. Matches the Classification "Sequence" pill when selected
    // (bg-emerald-500/border-emerald-500). Used for sequence work entries so
    // the work-type pill reads the same emerald as the classification above it.
    return 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600';
  }
  if (variant === 'failure') {
    // Dark solid red + white text — the failure-side twin of the 'value' variant.
    return 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700';
  }
  // Default variant — same style regardless of selection state so neighbouring
  // pills (PoT, Contact method, Work source) read as one consistent row.
  // Lighter grey text per Jonas 2026-04-22 so the session-sticky row feels
  // ambient rather than pulling the eye away from the capture form below.
  void hasSelection;
  return 'bg-white text-gray-500 border-gray-300 hover:border-gray-400';
}

export default function PillSelect({ value, onChange, options, placeholder, ariaLabel, className = '', variant = 'default', onAddNew, addNewLabel }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? null;

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

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${pillClasses(variant, Boolean(selected))}`}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {open && (
        <div
          ref={popoverMountRef}
          role="listbox"
          className="absolute z-30 left-0 top-full mt-1.5 min-w-full max-w-[calc(100vw-2rem)] py-1 rounded-lg bg-white border border-gray-200 shadow-lg"
        >
          {options.length === 0 && !onAddNew ? (
            <div className="px-3 py-2 text-sm text-gray-400">—</div>
          ) : (
            <>
              {options.map((opt) => {
                const isSelected = opt.id === value;
                const def = opt.operationalDefinition?.trim();
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="whitespace-nowrap">{opt.label}</div>
                    {def && (
                      <div className="mt-0.5 text-xs text-gray-500 font-normal whitespace-normal leading-snug max-w-xs">
                        {def}
                      </div>
                    )}
                  </button>
                );
              })}
              {onAddNew && (
                <>
                  {options.length > 0 && <div className="border-t border-gray-100 my-1" />}
                  <button
                    type="button"
                    onClick={() => {
                      onAddNew();
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm whitespace-nowrap text-sky-700 hover:bg-sky-50 transition-colors"
                  >
                    + {addNewLabel ?? 'Add new'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
