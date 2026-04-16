'use client';

interface SegmentedToggleOption {
  value: string;
  label: string;
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
export default function SegmentedToggle({ options, value, onChange, ariaLabel }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2 py-1 text-xs font-medium transition-colors ${
              active
                ? 'bg-[#ac2c2d] text-white'
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
