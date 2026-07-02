'use client';

/**
 * SubquestionInput — the kind→widget map for a milestone subquestion
 * (decision-box redesign, 2026-07-02).
 *
 * amount / number → number input; date → date input; duration → years+months;
 * text → free text (a named box, e.g. "Solicitor firm"); choice → a row of
 * pills built from the subquestion's options, coloured by polarity (positive =
 * green, negative = red, none = sky). Selecting a negative-polarity option calls
 * onNegativePick so the caller can offer to close the case.
 */

import { useLocale } from '@/lib/locale-context';

export type SubquestionKind = 'amount' | 'number' | 'date' | 'duration' | 'text' | 'choice';
export type OptionPolarity = 'positive' | 'negative' | null;

export interface SubquestionOption {
  id: string;
  label: string;
  polarity: OptionPolarity;
  sortOrder: number;
}

export interface Subquestion {
  id: string;
  milestoneId: string;
  label: string;
  kind: SubquestionKind;
  required: boolean;
  linkedWhatMattersTypeId: string | null;
  sortOrder: number;
  options: SubquestionOption[];
}

export interface Draft {
  num: string;
  date: string;
  years: string;
  months: string;
  choice: string;
  text: string;
}

export const EMPTY_DRAFT: Draft = { num: '', date: '', years: '', months: '', choice: '', text: '' };

const POLARITY_ACTIVE: Record<'positive' | 'negative' | 'none', string> = {
  positive: 'bg-green-600 text-white border-green-600',
  negative: 'bg-red-600 text-white border-red-600',
  none: 'bg-sky-600 text-white border-sky-600',
};
const POLARITY_RESTING: Record<'positive' | 'negative' | 'none', string> = {
  positive: 'border-green-300 text-green-800 bg-green-50 hover:bg-green-100',
  negative: 'border-red-300 text-red-800 bg-red-50 hover:bg-red-100',
  none: 'border-sky-300 text-sky-800 bg-sky-50 hover:bg-sky-100',
};

interface Props {
  subquestion: Subquestion;
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  compact?: boolean;
  /** Called when a negative-polarity choice option is picked (not deselected). */
  onNegativePick?: () => void;
}

export default function SubquestionInput({ subquestion: sq, draft: d, onChange, compact = false, onNegativePick }: Props) {
  const { t, tl } = useLocale();
  const inputCls = compact
    ? 'px-1.5 py-0.5 rounded text-[10px] text-gray-700 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none'
    : 'px-2 py-1 rounded-lg text-xs text-gray-700 bg-white border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none';
  const pillCls = compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-gray-500">
        {tl(sq.label)}{sq.required ? '' : <span className="text-gray-300"> ·</span>}
      </span>

      {(sq.kind === 'amount' || sq.kind === 'number') && (
        <input type="number" value={d.num} onChange={(e) => onChange({ num: e.target.value })} aria-label={tl(sq.label)} className={`${inputCls} w-24`} />
      )}

      {sq.kind === 'date' && (
        <input type="date" value={d.date} onChange={(e) => onChange({ date: e.target.value })} aria-label={tl(sq.label)} className={inputCls} />
      )}

      {sq.kind === 'duration' && (
        <div className="flex items-center gap-1">
          <input type="number" value={d.years} onChange={(e) => onChange({ years: e.target.value })} placeholder={t('capture.wmYearsPlaceholder')} aria-label={`${tl(sq.label)} — ${t('capture.wmYearsPlaceholder')}`} className={`${inputCls} w-14`} />
          <input type="number" value={d.months} onChange={(e) => onChange({ months: e.target.value })} placeholder={t('capture.wmMonthsPlaceholder')} aria-label={`${tl(sq.label)} — ${t('capture.wmMonthsPlaceholder')}`} className={`${inputCls} w-14`} />
        </div>
      )}

      {sq.kind === 'text' && (
        <input type="text" value={d.text} onChange={(e) => onChange({ text: e.target.value })} aria-label={tl(sq.label)} className={`${inputCls} w-40`} />
      )}

      {sq.kind === 'choice' && (
        <div className="flex flex-wrap justify-center gap-1">
          {[...sq.options].sort((a, b) => a.sortOrder - b.sortOrder).map((o) => {
            const active = d.choice === o.label;
            const tone = o.polarity ?? 'none';
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  const next = active ? '' : o.label;
                  onChange({ choice: next });
                  if (!active && o.polarity === 'negative') onNegativePick?.();
                }}
                className={`rounded-lg font-medium border transition-colors ${pillCls} ${active ? POLARITY_ACTIVE[tone] : POLARITY_RESTING[tone]}`}
              >
                {tl(o.label)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
