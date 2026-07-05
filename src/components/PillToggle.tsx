'use client';

import type { ReactNode } from 'react';

export interface PillToggleOption {
  value: string;
  label: ReactNode;
  /** Native tooltip on hover. */
  title?: string;
  /** Override the selected-state classes (bg/text/border) for this option —
   *  used to carry semantic colour (e.g. Value=green, Failure=red) instead of
   *  the default sky. Unselected state is unchanged. */
  activeClassName?: string;
}

interface Props {
  options: PillToggleOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  /** Tighter pills for narrow cards — `px-1.5 py-0.5 text-[11px]` + gap-1
   *  instead of the default `px-2.5 py-1 text-xs` + gap-1.5. Used by the work
   *  classification selector so its four pills stay on one line in a w-72 card. */
  dense?: boolean;
}

// Single-select row of DISCRETE pills — the dashboard's choice-control design
// language (2026-07-05). Selected = the soft sky wash of the decision-box
// milestone pills; unselected = a quiet white/gray pill. Distinct from
// SegmentedToggle (a joined bar): here every option is its own rounded pill,
// which is what reads as a clean "overview of choices". Sizing matches the
// capture page (text-xs). Wraps so a control bar never overflows.
export default function PillToggle({ options, value, onChange, ariaLabel, dense = false }: Props) {
  return (
    <div role="group" aria-label={ariaLabel} className={`flex flex-wrap items-center ${dense ? 'gap-1' : 'gap-1.5'}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={`rounded-full border font-medium transition-colors ${dense ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} ${
              active
                ? (opt.activeClassName ?? 'bg-sky-100 text-sky-700 border-sky-300')
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
