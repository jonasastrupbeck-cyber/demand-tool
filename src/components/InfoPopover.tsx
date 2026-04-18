'use client';

/**
 * InfoPopover — small circular ⓘ trigger with a dark popover card.
 *
 * Progressive-disclosure helper: replaces always-visible italic help paragraphs
 * with click-to-reveal definitions. Works on pointer and touch; dismisses on
 * click-outside and Escape.
 *
 * Mirrors the tooltip pattern used in CapabilityRadioGroup.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  // Close on outside pointerdown or Escape.
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

  // Ref callback runs synchronously after the popover mounts. Measures the rect,
  // then writes the corrected transform directly to the DOM — no state, no effect,
  // so no cascading renders.
  const popoverMountRef = useCallback((el: HTMLDivElement | null) => {
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
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 text-[10px] font-semibold leading-none transition-colors"
      >
        i
      </button>
      {open && (
        <div
          ref={popoverMountRef}
          role="tooltip"
          className="absolute z-30 left-1/2 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] p-3 rounded-lg bg-gray-900 text-white text-xs leading-snug shadow-lg"
        >
          {children}
          <div
            ref={caretRef}
            className="absolute -top-1 left-1/2 w-2 h-2 bg-gray-900"
            style={{ transform: 'translateX(-50%) rotate(45deg)' }}
            aria-hidden="true"
          />
        </div>
      )}
    </span>
  );
}
