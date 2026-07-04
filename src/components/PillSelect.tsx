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

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PillSelectOption {
  id: string;
  label: string;
  /** Optional operational definition, surfaced as a muted subtitle under the
   *  option's label in the popover — lets users learn what a type means at the
   *  moment they're choosing it. */
  operationalDefinition?: string | null;
}

export type PillSelectVariant = 'default' | 'value' | 'valueLight' | 'sequence' | 'failure' | 'add' | 'thinking' | 'milestone';

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
  /** When provided, the "+ new" row becomes an INLINE create field: the user
   *  types a label directly in the popover and submits, and this is called to
   *  create the option. Resolve with the new option id (selected automatically)
   *  or null on failure. Takes precedence over onAddNew. */
  onCreate?: (label: string) => Promise<string | null>;
  /** Label for the "+ new" action row in the popover. */
  addNewLabel?: string;
  /** When true, the pill fills its container's width (trigger `w-full`, label
   *  truncates) and the popover matches that width exactly (no 240px floor). Used
   *  for the per-block system-condition picker so it never grows wider than the
   *  work block it's attached to. Default false = today's content-width pill. */
  fullWidth?: boolean;
  /** Denser trigger for tight side-panels — `text-[11px] px-2 py-0.5` instead of
   *  the default `text-sm px-3 py-1.5`. Matches the flow saved-touch card sizing.
   *  The popover options stay readable. Default false. */
  compact?: boolean;
  /** Shrinks the POPOVER too — `text-xs px-2.5 py-1.5` options (and a 180px
   *  min-width instead of 240px) to match a `compact` trigger. Opt-in and
   *  separate from `compact` so existing compact pills keep readable menus.
   *  Default false. */
  compactMenu?: boolean;
}

function pillClasses(variant: PillSelectVariant, hasSelection: boolean): string {
  if (variant === 'add') {
    // "+ Add ..." style — solid light-blue (sky) outline. Used for system condition.
    return 'bg-white text-sky-700 border-sky-300 hover:border-sky-500 hover:bg-sky-50';
  }
  if (variant === 'milestone') {
    // Pale sky wash — matches the decision-box milestone pill headers
    // (bg-sky-50 wash, sky-200 border, sky-700 text) on the flow board and
    // in settings. Used for the value-step picker per Jonas 2026-07-04.
    return 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100';
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

export default function PillSelect({ value, onChange, options, placeholder, ariaLabel, className = '', variant = 'default', onAddNew, onCreate, addNewLabel, fullWidth = false, compact = false, compactMenu = false }: Props) {
  const [open, setOpen] = useState(false);
  // Inline-create state (only used when onCreate is provided).
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  // Green accent for the create affordance on green pills (life problem / value
  // demand); sky elsewhere — matches the strand the pill belongs to.
  const greenAdd = variant === 'value' || variant === 'valueLight';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  // Fixed-position coords for the portalled popover, so it floats above any
  // scroll/overflow container (e.g. the freeze-pane touch rail) instead of being
  // clipped inside the composer card.
  const [pos, setPos] = useState<{ left: number; width: number; maxHeight: number; top?: number; bottom?: number } | null>(null);
  const selected = options.find((o) => o.id === value) ?? null;

  const computePos = useRef(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const margin = 8;
    const gap = 6;
    // fullWidth pills match their trigger exactly (no 240px floor) so the
    // popover never exceeds the work block the pill sits in. compactMenu
    // lowers the floor to 180px — a 240px menu under a tight compact pill
    // reads oversized. fullWidth + compactMenu keeps the 180px floor so a
    // narrow row-filling pill (value step) still opens a readable menu.
    const minWidth = fullWidth ? (compactMenu ? Math.max(r.width, 180) : r.width) : compactMenu ? 180 : 240;
    const width = Math.min(Math.max(r.width, minWidth), window.innerWidth - margin * 2);
    let left = r.left;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width;
    if (left < margin) left = margin;
    // Vertical: open below by default, but flip ABOVE when below is cramped and
    // there's more room up top (e.g. a pill near the bottom of a long page). Cap
    // maxHeight to the available space so the menu always fits + scrolls instead
    // of running off-screen. Anchoring above by `bottom` keeps it glued to the pill.
    const spaceBelow = window.innerHeight - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const cap = Math.round(window.innerHeight * 0.6);
    const placeAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const avail = (placeAbove ? spaceAbove : spaceBelow) - gap;
    const maxHeight = Math.max(120, Math.min(cap, avail));
    if (placeAbove) setPos({ left, width, maxHeight, bottom: window.innerHeight - r.top + gap });
    else setPos({ left, width, maxHeight, top: r.bottom + gap });
  });

  useLayoutEffect(() => {
    if (open) computePos.current();
  }, [open]);

  // Reset the inline-create field whenever the popover closes.
  useEffect(() => {
    if (!open) { setAdding(false); setNewLabel(''); }
  }, [open]);

  async function submitCreate() {
    const trimmed = newLabel.trim();
    if (!trimmed || !onCreate || creating) return;
    setCreating(true);
    try {
      const id = await onCreate(trimmed);
      if (id) { onChange(id); setOpen(false); }
    } finally {
      setCreating(false);
      setNewLabel('');
      setAdding(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: PointerEvent) {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    // Reposition (not close) when an ancestor scrolls or the window resizes so
    // the floating menu stays glued to its pill.
    const reposition = () => computePos.current();
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className={`relative ${fullWidth ? 'block w-full' : 'inline-block'} ${className}`}>
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${fullWidth ? 'flex w-full justify-between' : 'inline-flex'} items-center gap-1.5 rounded-full font-medium border transition-colors ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1.5 text-sm'} ${pillClasses(variant, Boolean(selected))}`}
      >
        <span className={fullWidth ? 'min-w-0 truncate' : undefined}>{selected ? selected.label : placeholder}</span>
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
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          role="listbox"
          style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight }}
          className="z-50 overflow-y-auto py-1 rounded-lg bg-white border border-gray-200 shadow-lg"
        >
          {options.length === 0 && !onAddNew && !onCreate ? (
            <div className={`${compactMenu ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} text-gray-400`}>—</div>
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
                    className={`w-full text-left ${compactMenu ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} transition-colors ${
                      isSelected
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="break-words leading-snug">{opt.label}</div>
                    {def && (
                      <div className={`mt-0.5 ${compactMenu ? 'text-[10px]' : 'text-xs'} text-gray-500 font-normal whitespace-normal leading-snug`}>
                        {def}
                      </div>
                    )}
                  </button>
                );
              })}
              {(onCreate || onAddNew) && (
                <>
                  {options.length > 0 && <div className="border-t border-gray-100 my-1" />}
                  {onCreate ? (
                    adding ? (
                      <div className="flex items-center gap-1 px-2 py-1.5">
                        <input
                          type="text"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          placeholder={addNewLabel ?? 'Add new'}
                          aria-label={addNewLabel ?? 'Add new'}
                          autoFocus
                          disabled={creating}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); submitCreate(); }
                            // Cancel the inline field without closing the popover.
                            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setAdding(false); setNewLabel(''); }
                          }}
                          className={`flex-1 min-w-0 px-2 py-1 rounded border border-gray-300 text-sm text-gray-900 outline-none focus:ring-2 ${greenAdd ? 'focus:ring-green-500 focus:border-green-500' : 'focus:ring-sky-500 focus:border-sky-500'}`}
                        />
                        <button
                          type="button"
                          onClick={submitCreate}
                          disabled={!newLabel.trim() || creating}
                          aria-label={addNewLabel ?? 'Add new'}
                          className={`shrink-0 px-2 py-1 rounded text-sm font-medium text-white disabled:opacity-50 ${greenAdd ? 'bg-green-600 hover:bg-green-700' : 'bg-sky-600 hover:bg-sky-700'}`}
                        >
                          {creating ? '…' : '✓'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setAdding(true); setNewLabel(''); }}
                        className={`w-full text-left ${compactMenu ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} transition-colors ${greenAdd ? 'text-green-700 hover:bg-green-50' : 'text-sky-700 hover:bg-sky-50'}`}
                      >
                        + {addNewLabel ?? 'Add new'}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onAddNew!();
                        setOpen(false);
                      }}
                      className={`w-full text-left ${compactMenu ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} text-sky-700 hover:bg-sky-50 transition-colors`}
                    >
                      + {addNewLabel ?? 'Add new'}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
