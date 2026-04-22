'use client';

/**
 * InfoPopover — small circular ⓘ trigger with a dark popover card.
 *
 * Progressive-disclosure helper: replaces always-visible italic help paragraphs
 * with click-to-reveal definitions. Works on pointer and touch; dismisses on
 * click-outside and Escape.
 *
 * The popover card is rendered via a portal into document.body with
 * position:fixed, which sidesteps the parent's stacking context entirely — the
 * card always paints above nearby siblings (e.g., other ⓘ icons further down
 * the form) regardless of the surrounding CSS.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  /** aria-label for the trigger — should describe what the popover explains. */
  label: string;
  /** Popover content. */
  children: React.ReactNode;
  /** Optional classes merged onto the wrapper `<span>`. */
  className?: string;
}

export default function InfoPopover({ label, children, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ cx: number; top: number } | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  // Close on outside pointerdown or Escape. The "inside" check has to include
  // both the trigger wrapper AND the portaled popover, since they live in
  // separate subtrees of the DOM.
  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: PointerEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
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

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    const btn = wrapperRef.current?.querySelector('button');
    if (btn) {
      const r = btn.getBoundingClientRect();
      setCoords({ cx: r.left + r.width / 2, top: r.bottom + 8 });
    }
    setOpen(true);
  }

  // After the popover mounts, clamp horizontally so it stays inside the
  // viewport; counter-shift the caret so it still points at the trigger.
  const popoverMountRef = useCallback((el: HTMLDivElement | null) => {
    popoverRef.current = el;
    if (!el) return;
    el.style.transform = 'translateX(-50%)';
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let shift = 0;
    if (rect.left < margin) shift = margin - rect.left;
    else if (rect.right > window.innerWidth - margin) shift = window.innerWidth - margin - rect.right;
    if (shift !== 0) {
      el.style.transform = `translateX(calc(-50% + ${shift}px))`;
      if (caretRef.current) {
        caretRef.current.style.transform = `translateX(calc(-50% - ${shift}px)) rotate(45deg)`;
      }
    }
  }, []);

  return (
    <span ref={wrapperRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={label}
        aria-expanded={open}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 text-[10px] font-semibold leading-none transition-colors"
      >
        i
      </button>
      {open && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverMountRef}
          role="tooltip"
          className="fixed z-50 w-64 max-w-[calc(100vw-2rem)] p-3 rounded-lg bg-gray-900 text-white text-xs leading-snug shadow-lg whitespace-pre-line"
          style={{ left: coords.cx, top: coords.top }}
        >
          {children}
          <div
            ref={caretRef}
            className="absolute -top-1 left-1/2 w-2 h-2 bg-gray-900"
            style={{ transform: 'translateX(-50%) rotate(45deg)' }}
            aria-hidden="true"
          />
        </div>,
        document.body
      )}
    </span>
  );
}
