/**
 * Currency formatting for the 'currency' subquestion kind (2026-07-03).
 *
 * Amounts are stored as a plain number in case_subquestion_answers.value_number.
 * The currency is fixed per question (subquestions.currency_code), defaulting to
 * the study language's currency when unset. This is the first Intl.NumberFormat
 * use in the codebase — keep it here so display + parsing stay in one place.
 */

import type { Locale } from '@/lib/i18n';

// Default currency per study language (en→£, da→kr, sv→kr, de→€).
export const LOCALE_CURRENCY: Record<Locale, string> = {
  en: 'GBP',
  da: 'DKK',
  sv: 'SEK',
  de: 'EUR',
};

// A short pick-list for the authoring select. Order: the four defaults first.
export const CURRENCY_CHOICES = ['GBP', 'DKK', 'SEK', 'EUR', 'USD', 'NOK'] as const;

export function currencyForSubquestion(code: string | null | undefined, locale: Locale): string {
  return code && code.trim() ? code : LOCALE_CURRENCY[locale];
}

// Locale-aware currency string with thousand separators, whole-number amounts
// (100000 → "£100,000" / "100.000 kr"). Falls back to a plain number + code if
// the currency code is invalid (Intl.NumberFormat throws on unknown codes).
export function formatCurrency(value: number, currencyCode: string, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} ${currencyCode}`;
  }
}

// Parse a user-typed amount tolerating thousand separators and either decimal
// mark. Amounts here are effectively whole numbers, so we bias ambiguous groups
// (a separator followed by exactly three digits) to grouping, then treat a
// remaining comma as the decimal mark. Returns null when nothing numeric is left.
export function parseAmountLoose(s: string): number | null {
  const stripped = s.replace(/[^0-9.,-]/g, '');
  if (!stripped) return null;
  const cleaned = stripped
    .replace(/[.,](?=\d{3}(\D|$))/g, '') // drop grouping separators
    .replace(',', '.'); // any surviving comma is the decimal mark
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
