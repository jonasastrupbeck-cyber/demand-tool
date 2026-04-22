'use client';

type ActiveColor = 'burgundy' | 'green' | 'red' | 'emerald';

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
}

// Compact two-option (or N-option) toggle. Used by SC Helps/Hinders and
// Work-description Value/Failure blocks. Visual is a downsized version of
// the Classification button row in capture/page.tsx.
//
// Per-option `activeColor` lets callers map semantic meaning to colour —
// e.g. helps → green, hinders → red — so the colour of the active button
// reinforces the meaning rather than using a generic accent.
const ACTIVE_CLASSES: Record<ActiveColor, string> = {
  burgundy: 'bg-[#ac2c2d] text-white',
  green: 'bg-green-600 text-white',
  red: 'bg-red-600 text-white',
  // Emerald matches the Sequence classification pill — used on Flow block
  // free-text mode when the user tags a step as sequence work.
  emerald: 'bg-emerald-500 text-white',
};

export default function SegmentedToggle({ options, value, onChange, ariaLabel }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        const activeClass = ACTIVE_CLASSES[opt.activeColor ?? 'burgundy'];
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2 py-1 text-xs font-medium transition-colors ${
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
