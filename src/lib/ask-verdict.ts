/**
 * ask-verdict — the ONE place the "did we deliver on what mattered?" rules
 * live (2026-07-02, slice 4). Used by the capture-side live evaluation
 * (CaseDecisionPoints) and the dashboard aggregation (getAskDeliveryData),
 * so the two can never drift.
 *
 * Rules (agreed with Jonas):
 *   amount   — met if delivered ≤ the asked amount, or ≤ the range's upper end
 *   date     — met if delivered on/before the asked date (diffDays signed,
 *              negative = early)
 *   duration — met when it matches the ask exactly (diffMonths signed)
 *   choice / kind-incompatible pairs — not comparable, no verdict
 */

// 0042: 'number' compares like 'amount' (at-or-under); 'text'/'choice' are not
// comparable to a timed/amount ask.
export type CaptureKind = 'amount' | 'number' | 'date' | 'duration' | 'text' | 'choice';

export interface AskShape {
  targetDate: string | Date | null;
  amountSpecific: number | null;
  amountMin: number | null;
  amountMax: number | null;
  termYears: number | null;
  termMonths: number | null;
}

export interface DeliveredShape {
  valueNumber: number | null;
  valueDate: string | Date | null;
  valueYears: number | null;
  valueMonths: number | null;
}

export interface AskVerdict {
  /** The ask exists in a shape this field kind can be compared against. */
  comparable: boolean;
  /** null = comparable but no delivered value yet. */
  met: boolean | null;
  /** date kind: delivered − asked, in whole days (negative = early). */
  diffDays: number | null;
  /** duration kind: delivered − asked, in months. */
  diffMonths: number | null;
}

const NOT_COMPARABLE: AskVerdict = { comparable: false, met: null, diffDays: null, diffMonths: null };

// Whole-day index; date-only strings are pinned to noon UTC so timezone
// offsets can't shift them a day (same convention as the capture inputs).
const dayIndex = (d: string | Date): number => {
  const date = typeof d === 'string' ? new Date(d.length <= 10 ? `${d}T12:00:00.000Z` : d) : d;
  return Math.floor(date.getTime() / 86_400_000);
};

export function askVerdict(kind: CaptureKind, ask: AskShape, delivered: DeliveredShape): AskVerdict {
  if ((kind === 'amount' || kind === 'number') && (ask.amountSpecific != null || ask.amountMin != null || ask.amountMax != null)) {
    const cap = ask.amountSpecific ?? ask.amountMax; // at-or-under rule
    if (cap == null) return { comparable: true, met: null, diffDays: null, diffMonths: null };
    if (delivered.valueNumber == null) return { comparable: true, met: null, diffDays: null, diffMonths: null };
    return { comparable: true, met: delivered.valueNumber <= cap, diffDays: null, diffMonths: null };
  }
  if (kind === 'date' && ask.targetDate != null) {
    if (delivered.valueDate == null) return { comparable: true, met: null, diffDays: null, diffMonths: null };
    const diff = dayIndex(delivered.valueDate) - dayIndex(ask.targetDate);
    return { comparable: true, met: diff <= 0, diffDays: diff, diffMonths: null };
  }
  if (kind === 'duration' && (ask.termYears != null || ask.termMonths != null)) {
    if (delivered.valueYears == null && delivered.valueMonths == null) {
      return { comparable: true, met: null, diffDays: null, diffMonths: null };
    }
    const deliveredMonths = (delivered.valueYears ?? 0) * 12 + (delivered.valueMonths ?? 0);
    const askedMonths = (ask.termYears ?? 0) * 12 + (ask.termMonths ?? 0);
    const diff = deliveredMonths - askedMonths;
    return { comparable: true, met: diff === 0, diffDays: null, diffMonths: diff };
  }
  return NOT_COMPARABLE;
}
