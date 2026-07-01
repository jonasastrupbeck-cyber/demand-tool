'use client';

type ActiveColor = 'burgundy' | 'green' | 'red' | 'emerald' | 'blue' | 'rose';

interface SegmentedToggleOption {
  value: string;
  label: string;
  // Colour of the button when this option is active. Defaults to burgundy
  // (brand accent) when unspecified. Use 'green' for value/helps and 'red'
  // for failure/hinders to carry Vanguard semantics through the UI.
  activeColor?: ActiveColor;
}

interface Props {
  options: SegmentedToggleOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  /** When true, clicking the already-selected option clears it (fires
   *  onChange('')). Opt-in so toggles that must always hold a value (work
   *  V/S/F, customer-felt) keep their current behaviour. Used by the decision
   *  points so a mis-click can be un-clicked. */
  allowDeselect?: boolean;
  /** Denser buttons (`px-1.5 py-0.5 text-[11px]`) for tight side-panels, matching
   *  the flow saved-touch card sizing. Default false = `px-2 py-1 text-xs`. */
  compact?: boolean;
}

// Compact two-option (or N-option) toggle. Used by SC Helps/Hinders and
// Work-description Value/Failure blocks. Visual is a downsized version of
// the Classification button row in capture/page.tsx.
//
// Per-option `activeColor` lets callers map semantic meaning to colour —
// e.g. helps → green, hinders → red — so the colour of the active button
// reinforces the meaning rather than using a generic accent.
const ACTIVE_CLASSES: Record<ActiveColor, string> = {
  burgundy: 'bg-brand text-white',
  green: 'bg-green-600 text-white',
  red: 'bg-red-600 text-white',
  // Emerald matches the Sequence classification pill — used on Flow block
  // free-text mode when the user tags a step as sequence work.
  emerald: 'bg-emerald-500 text-white',
  blue: 'bg-blue-600 text-white',
  // Rose — failure DEMAND (a demand hitting you): failure-adjacent red, kept
  // distinct from 'red' (failure work) and independent of the brand override.
  rose: 'bg-rose-600 text-white',
};

export default function SegmentedToggle({ options, value, onChange, ariaLabel, allowDeselect = false, compact = false }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        const activeClass = ACTIVE_CLASSES[opt.activeColor ?? 'burgundy'];
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(allowDeselect && active ? '' : opt.value)}
            className={`font-medium transition-colors ${compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'} ${
              active
                ? activeClass
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
