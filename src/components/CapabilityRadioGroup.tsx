'use client';

/**
 * Capability of Response — radio-style buttons with a hover/tap tooltip card
 * showing the operational definition + an example past demand.
 *
 * Replaces the old "Handling type" dropdown on the capture page and edit modal.
 *
 * Tooltip behaviour:
 *  - Pointer devices: hover opens the card after a short delay; mouse-leave closes it.
 *  - Touch devices: tapping the (i) icon toggles the card.
 *  - Keyboard: arrow-keys move focus between radios; Space/Enter selects; the focused
 *    radio's tooltip is also shown so keyboard users see the definition.
 *  - Tooltip lazily fetches one example demand per type from the existing
 *    /entries/search endpoint (extended to accept handlingTypeId).
 *  - Results are cached on the component instance for the session.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/locale-context';

interface CapabilityOption {
  id: string;
  label: string;
  operationalDefinition?: string | null;
}

interface Props {
  code: string;
  options: CapabilityOption[];
  value: string;
  onChange: (id: string) => void;
  // Optional slot rendered before the radios (e.g. an InlineTypeAdder "+ add new" button).
  leading?: React.ReactNode;
}

export default function CapabilityRadioGroup({ code, options, value, onChange, leading }: Props) {
  const { t, tl } = useLocale();
  const groupId = useId();
  const [openId, setOpenId] = useState<string | null>(null);
  const [examples, setExamples] = useState<Record<string, string | null>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const [tooltipShift, setTooltipShift] = useState(0);

  // After the tooltip mounts/changes, measure it and shift it horizontally
  // if it would clip the viewport edges. We shift the tooltip and counter-shift
  // the caret so the caret stays centred over the button.
  useLayoutEffect(() => {
    if (!openId) {
      setTooltipShift(0);
      return;
    }
    const el = tooltipRef.current;
    if (!el) return;
    // Reset before measuring so we read the natural centred position.
    el.style.transform = 'translateX(-50%)';
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let shift = 0;
    if (rect.left < margin) shift = margin - rect.left;
    else if (rect.right > window.innerWidth - margin) shift = window.innerWidth - margin - rect.right;
    setTooltipShift(shift);
  }, [openId]);

  // Close tooltip when clicking/tapping outside (touch devices).
  useEffect(() => {
    function onDocPointer(e: PointerEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpenId(null);
    }
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
  }, []);

  async function ensureExample(id: string) {
    if (id in examples) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/studies/${encodeURIComponent(code)}/entries/search?handlingTypeId=${id}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        const first = Array.isArray(data) && data.length > 0 ? data[0]?.verbatim ?? null : null;
        setExamples((prev) => ({ ...prev, [id]: first }));
      } else {
        setExamples((prev) => ({ ...prev, [id]: null }));
      }
    } catch {
      setExamples((prev) => ({ ...prev, [id]: null }));
    } finally {
      setLoadingId((curr) => (curr === id ? null : curr));
    }
  }

  function openTooltip(id: string) {
    setOpenId(id);
    void ensureExample(id);
  }

  function handleHoverEnter(id: string) {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => openTooltip(id), 250);
  }

  function handleHoverLeave() {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setOpenId(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = options[(idx + 1) % options.length];
      if (next) {
        onChange(next.id);
        const btn = containerRef.current?.querySelector<HTMLButtonElement>(`[data-cap-id="${next.id}"]`);
        btn?.focus();
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = options[(idx - 1 + options.length) % options.length];
      if (prev) {
        onChange(prev.id);
        const btn = containerRef.current?.querySelector<HTMLButtonElement>(`[data-cap-id="${prev.id}"]`);
        btn?.focus();
      }
    }
  }

  return (
    <div ref={containerRef} role="radiogroup" aria-labelledby={`${groupId}-label`} className="flex flex-wrap gap-2 items-center">
      {leading}
      {options.map((opt, idx) => {
        const selected = value === opt.id;
        const isOpen = openId === opt.id;
        const example = examples[opt.id];
        const def = opt.operationalDefinition?.trim();
        const hasTooltip = Boolean(def) || example !== undefined;
        return (
          <div key={opt.id} className="relative">
            <button
              data-cap-id={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-describedby={isOpen ? `${groupId}-tip-${opt.id}` : undefined}
              tabIndex={selected || (!value && idx === 0) ? 0 : -1}
              onClick={() => onChange(opt.id)}
              onFocus={() => openTooltip(opt.id)}
              onBlur={() => setOpenId((curr) => (curr === opt.id ? null : curr))}
              onMouseEnter={() => handleHoverEnter(opt.id)}
              onMouseLeave={handleHoverLeave}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selected
                  ? 'bg-sky-500 text-white ring-2 ring-sky-500 ring-offset-1'
                  : 'bg-white text-sky-700 border border-sky-300 hover:bg-sky-50 hover:border-sky-500'
              }`}
            >
              {tl(opt.label)}
              {hasTooltip && (
                <span
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[10px] font-semibold cursor-help"
                  onClick={(e) => {
                    // On touch devices the parent click selects; this stops that and
                    // toggles the tooltip instead.
                    e.stopPropagation();
                    setOpenId((curr) => (curr === opt.id ? null : opt.id));
                    void ensureExample(opt.id);
                  }}
                  aria-hidden="true"
                >
                  i
                </span>
              )}
            </button>
            {isOpen && hasTooltip && (
              <div
                ref={tooltipRef}
                id={`${groupId}-tip-${opt.id}`}
                role="tooltip"
                className="absolute z-20 left-1/2 top-full mt-2 w-64 p-3 rounded-lg bg-gray-900 text-white text-xs shadow-lg"
                style={{ transform: `translateX(calc(-50% + ${tooltipShift}px))` }}
              >
                <div className="font-semibold text-sm mb-1">{tl(opt.label)}</div>
                {def ? (
                  <p className="text-gray-200 leading-snug">{def}</p>
                ) : (
                  <p className="text-gray-400 italic">{t('capture.capabilityNoDefinition')}</p>
                )}
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                    {t('capture.capabilityExampleHeader')}
                  </div>
                  {loadingId === opt.id && !(opt.id in examples) ? (
                    <p className="text-gray-300">…</p>
                  ) : example ? (
                    <p className="text-gray-100 italic">&ldquo;{example}&rdquo;</p>
                  ) : (
                    <p className="text-gray-400 italic">{t('capture.capabilityNoExample')}</p>
                  )}
                </div>
                {/* Caret — counter-shifted so it stays centred over the button when the tooltip is shifted. */}
                <div
                  className="absolute -top-1 left-1/2 w-2 h-2 rotate-45 bg-gray-900"
                  style={{ transform: `translateX(calc(-50% - ${tooltipShift}px)) rotate(45deg)` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
