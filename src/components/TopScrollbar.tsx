'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Synced top mirror scrollbar (2026-07-07). Generalises the flow work rail's
// top scrollbar (CasePanel) so any horizontally-overflowing strip can show a
// second, synced scrollbar at its TOP — handy when the native bottom bar sits
// far down the page. Usage:
//   const bar = useSyncedTopScrollbar([deps that change content width]);
//   <TopScrollbar bar={bar} />
//   <div ref={bar.mainRef} onScroll={bar.onMainScroll} className="…overflow-x-auto">…</div>
// Shares the `.rail-topscroll` CSS (globals.css) with the rail.
export function useSyncedTopScrollbar(deps: unknown[] = []) {
  const mainRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [overflow, setOverflow] = useState(false);

  const measure = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    // Only treat as scrollable when the element ACTUALLY is an x-scroll
    // container. Some call sites reuse the same <div> as a plain (non-scrolling)
    // block in another mode — that just widens an ancestor and must NOT get a
    // spurious top bar.
    const ox = getComputedStyle(el).overflowX;
    const scrollable = ox === 'auto' || ox === 'scroll';
    setContentWidth(el.scrollWidth);
    setOverflow(scrollable && el.scrollWidth > el.clientWidth + 1);
  }, []);

  useEffect(() => {
    measure();
    const el = mainRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  // Mirror one element's scrollLeft onto the other; bail if already within 1px
  // so the reflected scroll event can't ping-pong (same guard as the rail).
  const onMainScroll = () => {
    const f = mainRef.current, t = topRef.current;
    if (f && t && Math.abs(t.scrollLeft - f.scrollLeft) >= 1) t.scrollLeft = f.scrollLeft;
  };
  const onTopScroll = () => {
    const f = topRef.current, t = mainRef.current;
    if (f && t && Math.abs(t.scrollLeft - f.scrollLeft) >= 1) t.scrollLeft = f.scrollLeft;
  };

  return { mainRef, topRef, contentWidth, overflow, onMainScroll, onTopScroll, remeasure: measure };
}

export function TopScrollbar({ bar, className = '' }: {
  bar: ReturnType<typeof useSyncedTopScrollbar>;
  className?: string;
}) {
  const { topRef, onTopScroll, contentWidth, overflow } = bar;
  return (
    <div
      ref={topRef}
      onScroll={onTopScroll}
      aria-hidden
      className={`rail-topscroll overflow-x-auto overflow-y-hidden mb-1 ${overflow ? 'hidden md:block' : 'hidden'} ${className}`}
    >
      <div style={{ width: contentWidth }} className="h-px" />
    </div>
  );
}
