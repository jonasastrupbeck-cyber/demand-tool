'use client';

/**
 * CollapsibleCard — a settings section that collapses to just its title bar
 * (2026-07-04). Every study-settings section uses this so the page opens as a
 * tidy stack of headers you expand one at a time. Collapsed by default; own
 * state persists across parent re-renders (e.g. loadStudy after an edit) because
 * the instance stays mounted.
 */

import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  /** Optional right-aligned slot in the header (e.g. a count badge). */
  accessory?: ReactNode;
  children: ReactNode;
}

export default function CollapsibleCard({ title, description, defaultOpen = false, accessory, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  // No overflow-hidden on the card: an expanded section may contain an absolutely
  // positioned dropdown (e.g. the milestone "+ Add preset" menu) that must overflow
  // the card. Header corners are rounded per open/closed state instead.
  return (
    <div className="rounded-xl shadow-sm bg-white border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full flex items-center gap-2 text-left px-5 py-3.5 hover:bg-gray-50 transition-colors ${open ? 'rounded-t-xl' : 'rounded-xl'}`}
      >
        <h2 className="flex-1 text-base font-semibold text-gray-900">{title}</h2>
        {accessory}
        <span className="shrink-0 text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
          {children}
        </div>
      )}
    </div>
  );
}
