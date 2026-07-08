'use client';

import type { ReactNode } from 'react';

export interface PillMultiOption {
  value: string;
  label: ReactNode;
  title?: string;
}

interface Props {
  options: PillMultiOption[];
  /** Selected values. Empty array = "All" (no filter). */
  value: string[];
  onChange: (value: string[]) => void;
  ariaLabel?: string;
  /** Label for the reset-to-all pill (defaults handled by caller via i18n). */
  allLabel: ReactNode;
}

// Multi-select row of pills (2026-07-08) — same design language as PillToggle,
// but several pills can be active at once, and a leading "All" pill clears the
// selection (empty = no filter). Used for the flow dashboard's value-demand
// scope. Wraps so a control bar never overflows.
export default function PillMultiSelect({ options, value, onChange, ariaLabel, allLabel }: Props) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  const allActive = value.length === 0;
  const pill = (active: boolean) =>
    `rounded-full border font-medium transition-colors px-2.5 py-1 text-xs ${
      active
        ? 'bg-sky-100 text-sky-700 border-sky-300'
        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
    }`;
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap items-center gap-1.5">
      <button type="button" aria-pressed={allActive} onClick={() => onChange([])} className={pill(allActive)}>
        {allLabel}
      </button>
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            title={opt.title}
            onClick={() => toggle(opt.value)}
            className={pill(active)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
