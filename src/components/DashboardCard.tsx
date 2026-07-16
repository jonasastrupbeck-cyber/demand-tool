'use client';

import { useState } from 'react';

// Per-study dashboard card reorder + show/hide (2026-07-16).
//
// The dashboard's chart cards are wrapped one-per-`CardStack` entry. In normal
// mode `DashboardCard` renders its child verbatim (zero overhead — the wrapper
// disappears). In "rearrange" mode it adds a draggable outline, a drag affordance
// and an eye toggle so a study can order/hide its cards. Reorder + hidden state
// live in the dashboard page (draft copies while rearranging) and persist to the
// study's `dashboardCardConfig` JSON on Save.
//
// Drag mechanics mirror the saved-touch reorder in CasePanel.tsx (native HTML5
// drag: draggable + onDragStart/onDragOver preventDefault/onDrop, filter-then-
// splice the dragged id before the drop target).

export type CardDescriptor = { id: string; node: React.ReactNode };

// Apply a saved order + hidden-set to the default-ordered card list.
// Ordering rule: ids present in `order` sort by their saved position; ids NOT in
// `order` (new cards shipped later, or never-arranged) fall to the end keeping
// their default relative order. So a new chart never corrupts a saved layout and
// defaults to visible. In rearrange mode hidden cards are KEPT (rendered dimmed)
// so they can be un-hidden; otherwise they're filtered out (unmounted).
export function orderCards(
  cards: CardDescriptor[],
  order: string[],
  hidden: Set<string>,
  rearranging: boolean,
): CardDescriptor[] {
  const rank = new Map(order.map((id, i) => [id, i]));
  const sorted = cards
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const ar = rank.has(a.c.id) ? rank.get(a.c.id)! : Infinity;
      const br = rank.has(b.c.id) ? rank.get(b.c.id)! : Infinity;
      return ar !== br ? ar - br : a.i - b.i;
    })
    .map((x) => x.c);
  return rearranging ? sorted : sorted.filter((c) => !hidden.has(c.id));
}

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9.9 4.2A9.8 9.8 0 0 1 12 4c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.1M6.6 6.6A17 17 0 0 0 2 11s3.5 7 10 7a9.8 9.8 0 0 0 4-.9" />
    <path d="M3 3l18 18" />
  </svg>
);

function DashboardCard({
  hidden,
  rearranging,
  isDragging,
  showLabel,
  hideLabel,
  onDragStart,
  onDragEnd,
  onDrop,
  onToggleHide,
  children,
}: {
  hidden: boolean;
  rearranging: boolean;
  isDragging: boolean;
  showLabel: string;
  hideLabel: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onToggleHide: () => void;
  children: React.ReactNode;
}) {
  // Zero-footprint in normal mode: the wrapper vanishes entirely so layout,
  // recharts widths, collapse context and the PPTX export DOM are untouched.
  if (!rearranging) return <>{children}</>;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      className={`relative rounded-xl border-2 border-dashed p-1 cursor-grab active:cursor-grabbing transition-colors ${
        isDragging ? 'border-brand opacity-50' : 'border-gray-300'
      } ${hidden ? 'opacity-40' : ''}`}
    >
      <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-lg bg-white/90 px-1 py-0.5 shadow-sm ring-1 ring-gray-200">
        <button
          type="button"
          onClick={onToggleHide}
          aria-label={hidden ? showLabel : hideLabel}
          title={hidden ? showLabel : hideLabel}
          className="grid place-items-center h-6 w-6 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100"
        >
          {hidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
        <span className="grid place-items-center h-6 w-5 text-gray-400" aria-hidden>⠿</span>
      </div>
      {children}
    </div>
  );
}

// Renders a view's cards through the saved order + hidden-set. Owns only the
// ephemeral `dragId` (which card is mid-drag); the committed/draft order & hidden
// set are supplied by the page, which persists them.
export function CardStack({
  cards,
  order,
  hidden,
  rearranging,
  showLabel,
  hideLabel,
  onReorder,
  onToggleHide,
}: {
  cards: CardDescriptor[];
  order: string[];
  hidden: Set<string>;
  rearranging: boolean;
  showLabel: string;
  hideLabel: string;
  onReorder: (next: string[]) => void;
  onToggleHide: (id: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const visible = orderCards(cards, order, hidden, rearranging);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    // Rebuild the order from what's currently displayed so the result matches
    // what the user sees (new/unranked cards keep their on-screen position).
    const ids = visible.map((c) => c.id).filter((id) => id !== dragId);
    const at = ids.indexOf(targetId);
    if (at < 0) { setDragId(null); return; }
    ids.splice(at, 0, dragId);
    setDragId(null);
    onReorder(ids);
  };

  return (
    <>
      {visible.map((c) => (
        <DashboardCard
          key={c.id}
          hidden={hidden.has(c.id)}
          rearranging={rearranging}
          isDragging={dragId === c.id}
          showLabel={showLabel}
          hideLabel={hideLabel}
          onDragStart={() => setDragId(c.id)}
          onDragEnd={() => setDragId(null)}
          onDrop={() => handleDrop(c.id)}
          onToggleHide={() => onToggleHide(c.id)}
        >
          {c.node}
        </DashboardCard>
      ))}
    </>
  );
}
